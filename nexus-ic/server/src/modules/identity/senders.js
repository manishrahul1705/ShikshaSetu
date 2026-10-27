import mongoose from 'mongoose';
import User from '../auth/User.js';
import { fingerprint } from '../vault/crypto.js';
import { isVerified, getReporterId } from './index.js';
import { audit } from './support.js';
export const SenderBinding = mongoose.model('IdentitySenderBinding', new mongoose.Schema({
  senderHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  reporterId: { type: String, required: true },
}, { strict: 'throw' }), 'identity_sender_bindings');
export const normaliseSender = value => typeof value === 'string' ? value.trim().normalize('NFC').toLowerCase() : '';
export const hashSender = value => fingerprint(`email-sender:${normaliseSender(value)}`);
export async function lookupSender(email) {
  const normalised = normaliseSender(email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalised)) return null;
  const binding = await SenderBinding.findOne({ senderHash: hashSender(normalised) }).lean();
  if (!binding || !await isVerified(binding.userId)) return null;
  const user = await User.findById(binding.userId).select('_id active').lean();
  if (!user?.active || await getReporterId(user._id) !== binding.reporterId) return null;
  return { reporterId: binding.reporterId, userId: String(user._id) };
}
// Fixture binding only, never a real-mailbox ownership claim. Raw addresses are
// derived transiently from existing synthetic usernames and are not stored.
export async function seedSyntheticSenders() {
  if ((process.env.APP_MODE || 'demo') !== 'demo') return;
  for (const user of await User.find({ synthetic: true, active: true }).lean()) {
    await bindSyntheticSender(user._id, { id: 'identity-sender-seed', role: 'system' });
  }
}
export async function bindSyntheticSender(userId, actor) {
  if ((process.env.APP_MODE || 'demo') !== 'demo' || !await isVerified(userId)) return;
  const user = await User.findOne({ _id: userId, synthetic: true, active: true }).lean();
  if (!user) return;
  await SenderBinding.init();
  const reporterId = await getReporterId(userId), senderHash = hashSender(`${user.username}@synthetic.invalid`);
  const existing = await SenderBinding.findOne({ userId });
  if (existing?.senderHash === senderHash && existing.reporterId === reporterId) return;
  await SenderBinding.updateOne({ userId }, { $set: { senderHash, reporterId } }, { upsert: true });
  await audit(actor, 'identity.sender.bound', 'reporter', reporterId);
}
