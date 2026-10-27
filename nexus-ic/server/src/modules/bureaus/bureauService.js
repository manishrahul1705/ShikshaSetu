import Bureau from './models.js';
import User from '../auth/User.js';

/**
 * List all bureaus and cells (N73)
 */
export async function listBureaus() {
  return Bureau.find({ active: true }).sort({ code: 1 }).lean();
}

/**
 * Get bureau by code or name
 */
export async function getBureauByCode(codeOrName) {
  if (!codeOrName) return null;
  return Bureau.findOne({
    $or: [{ code: codeOrName }, { name: codeOrName }, { shortName: codeOrName }],
    active: true,
  }).lean();
}

/**
 * Get officers belonging to a bureau
 */
export async function getBureauOfficers(bureauCodeOrName) {
  const bureau = await getBureauByCode(bureauCodeOrName);
  if (!bureau) return [];

  // Match users whose bureau matches bureau.code, bureau.name or shortName
  return User.find({
    role: 'bureau_officer',
    $or: [{ bureau: bureau.code }, { bureau: bureau.name }],
  })
    .select('username role bureau email')
    .lean();
}
