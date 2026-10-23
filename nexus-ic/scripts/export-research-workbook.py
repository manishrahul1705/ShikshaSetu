"""Read supplied OOXML without installing an Excel reader; emit registry JSON/CSV.
Workbook cells are data, never commands. Does not fetch any embedded URL.
"""
import csv
import hashlib
import json
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

def read_sheets(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(e.itertext()) for e in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        links = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        result = {}
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).find('m:sheets', NS):
            target = links[sheet.attrib[REL]]
            target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            headers, records = {}, []
            for row in ET.fromstring(archive.read(target)).findall('m:sheetData/m:row', NS):
                cells = {}
                for cell in row:
                    value = cell.find('m:v', NS)
                    value = value.text if value is not None else ''
                    if cell.attrib.get('t') == 's': value = strings[int(value)]
                    if cell.attrib.get('t') == 'inlineStr': value = ''.join(cell.find('m:is', NS).itertext())
                    cells[re.sub(r'\d', '', cell.attrib['r'])] = value
                if not headers: headers = cells
                else: records.append({'sourceRow': int(row.attrib['r']), 'raw': {label: cells.get(col, '') for col, label in headers.items()}})
            result[sheet.attrib['name']] = records
        return result

def export():
    path = ROOT / 'data/aicte/AICTE_All_India_Colleges.xlsx'
    sheets = read_sheets(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    payload = {
        'version': 'AICTE-RESEARCH-20261027-v1', 'sourceFileName': path.name, 'fileHash': digest,
        'incompleteSource': True, 'caveat': 'INCOMPLETE - NOT A CERTIFIED ALL-INDIA APPROVAL LIST',
        'institutions': sheets['Master colleges'],
        'courses': sheets.get('Courses', []), 'nameVariations': sheets.get('Name variations', []),
        'duplicateReview': sheets.get('Duplicate review', []), 'approvalSources': sheets.get('Approval source log', []),
    }
    out = ROOT / 'data/aicte/research-registry.json'
    out.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    with (ROOT / 'data/aicte/institutions.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(payload['institutions'][0]['raw']))
        writer.writeheader(); writer.writerows(row['raw'] for row in payload['institutions'])
    print(json.dumps({'records': len(payload['institutions']), 'courses': len(payload['courses']), 'fileHash': digest, 'incompleteSource': True}))

if __name__ == '__main__': export()
