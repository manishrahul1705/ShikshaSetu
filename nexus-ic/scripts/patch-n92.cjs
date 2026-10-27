const fs = require('fs');
const path = require('path');

// 1. Update server/src/modules/auth/seed.js
const authSeedPath = path.resolve('server/src/modules/auth/seed.js');
let authSeed = fs.readFileSync(authSeedPath, 'utf8');

const regionalOfficersBlock = `    username: 'regional1',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer',
    bureau: null,
    region: 'Northern',
  },
  {
    username: 'regional_northern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Northern)',
    bureau: null,
    region: 'Northern',
  },
  {
    username: 'regional_western',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Western)',
    bureau: null,
    region: 'Western',
  },
  {
    username: 'regional_southern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Southern)',
    bureau: null,
    region: 'Southern',
  },
  {
    username: 'regional_central',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Central)',
    bureau: null,
    region: 'Central',
  },
  {
    username: 'regional_eastern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Eastern)',
    bureau: null,
    region: 'Eastern',
  },
  {
    username: 'regional_northeastern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (North Eastern)',
    bureau: null,
    region: 'North Eastern',
  },`;

if (!authSeed.includes('regional_western')) {
  authSeed = authSeed.replace(
    `    username: 'regional1',\n    role: 'regional_officer',\n    displayName: 'Regional Grievance Officer',\n    bureau: null,\n    region: 'Northern',\n  },`,
    regionalOfficersBlock
  );
  fs.writeFileSync(authSeedPath, authSeed, 'utf8');
  console.log('Successfully updated auth seed with 6 regional officers');
} else {
  console.log('auth seed already has regional officers');
}

// 2. Update server/src/modules/rulebook/seed.js
const rulebookSeedPath = path.resolve('server/src/modules/rulebook/seed.js');
let rulebookSeed = fs.readFileSync(rulebookSeedPath, 'utf8');

const n92Rule = `    {
      family: 'ROUTING',
      version: 'DEMO-REGIONAL-ROUTE-v1',
      description: 'ICID-based regional routing to Regional Grievance Cell across all 6 AICTE regions (N92)',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        confidenceThreshold: 0.70,
        enableRegionalRouting: true,
        regions: [
          'Northern',
          'Western',
          'Southern',
          'Central',
          'Eastern',
          'North Eastern',
        ],
        regionalCellFormat: 'Regional Grievance Cell ({region})',
        explainFormat: 'Region {region} from PID {pid} (ICID {icid} MATCH)',
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },`;

if (!rulebookSeed.includes('DEMO-REGIONAL-ROUTE-v1')) {
  rulebookSeed = rulebookSeed.replace(
    "    {\n      family: 'ROUTING',\n      version: 'DEMO-ROUTE-v1',",
    n92Rule + "\n    {\n      family: 'ROUTING',\n      version: 'DEMO-ROUTE-v1',"
  );
  fs.writeFileSync(rulebookSeedPath, rulebookSeed, 'utf8');
  console.log('Successfully added DEMO-REGIONAL-ROUTE-v1 to rulebook seed');
} else {
  console.log('rulebook seed already contains DEMO-REGIONAL-ROUTE-v1');
}

// 3. Update server/src/modules/routing/routingEngine.js
const routingEnginePath = path.resolve('server/src/modules/routing/routingEngine.js');
let routingEngine = fs.readFileSync(routingEnginePath, 'utf8');

const oldFactor2 = `  // Factor 2: Institution type and AICTE region
  const instType = institutionProfile?.institutionType || caseDoc.pidSnapshot?.institutionType;
  const region = institutionProfile?.region || caseDoc.pidSnapshot?.region;

  if (region) {
    reasons.push(\`Institution region is '\${region}'\`);
    if (!secondary && region !== 'Central') {
      secondary = 'RO';
    }
  } else {
    confidence -= 0.10;
    reasons.push('Institution region is not specified in profile');
  }`;

const newFactor2 = `  // Factor 2: Institution type and AICTE region (N92: ICID-based regional routing)
  const instType = institutionProfile?.institutionType || caseDoc.pidSnapshot?.institutionType;
  const region = institutionProfile?.region || caseDoc.pidSnapshot?.region;
  const icid = institutionProfile?.icid || caseDoc.icidSnapshot?.icid;
  const pid = caseDoc.institutionPid || institutionProfile?.pid || caseDoc.pidSnapshot?.pid;

  if (region) {
    const icidTag = icid ? \` (ICID \${icid} MATCH)\` : '';
    reasons.push(\`Region \${region} from PID \${pid}\${icidTag}\`);
    reasons.push(\`Institution region is '\${region}'\`);
    const regionalCell = \`Regional Grievance Cell (\${region})\`;
    if (!secondary) {
      secondary = regionalCell;
    }
  } else {
    confidence -= 0.10;
    reasons.push('Institution region is not specified in profile');
  }`;

if (!routingEngine.includes('icidTag')) {
  routingEngine = routingEngine.replace(oldFactor2, newFactor2);
  fs.writeFileSync(routingEnginePath, routingEngine, 'utf8');
  console.log('Successfully updated routingEngine.js factor 2 with N92 explainable regional routing');
} else {
  console.log('routingEngine.js already contains N92 factor 2');
}
