import { it, expect } from 'vitest';
import { monthlyPdf } from '../src/modules/additions/n87-monthly-report/pdf.js';
import { monthlyLedger } from '../src/modules/additions/n87-monthly-report/service.js';
import { encodeInvisible, decodeInvisible } from '../src/modules/additions/n55-watermark/service.js';
it('[A-N87] PDF ledger paginates all balances and retains a traceable export watermark', () => {
  const cases=Array.from({length:60},(_,i)=>({_id:String(i),masterCaseId:`NX-2026-${i}`,owningBureau:`Office ${i}`,status:'Under Process',createdAt:new Date('2026-09-01')}));
  const report={...monthlyLedger(cases,[],[],[],{month:'2026-10'}),scope:'All permitted cases',denominator:60};
  const code='0123456789abcdef', pdf=monthlyPdf(report,{code,invisible:encodeInvisible(code),footer:'Exported by Authority at 2026-10-26'}).toString();
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);expect(pdf).toContain('Office 59');expect(pdf).toContain('Reconciled');expect(pdf).toContain('Exported by Authority');
  const hex=pdf.match(/\/Subject <FEFF([a-f0-9]+)>/)[1];const bytes=Buffer.from(hex,'hex');bytes.swap16();expect(decodeInvisible(bytes.toString('utf16le'))).toBe(code);
  const offset=Number(pdf.match(/startxref\n(\d+)/)[1]);expect(pdf.slice(offset,offset+4)).toBe('xref');
  expect(pdf.match(/\/Type \/Page /g).length).toBeGreaterThan(1);
});
