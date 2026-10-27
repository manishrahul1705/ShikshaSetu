import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { applyPlugins } from '../../models/plugins.js';

const ROLES = [
  'student',
  'faculty',
  'institution_admin',
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'auditor',
  'system_admin',
];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES },
    displayName: { type: String, required: true },
    bureau: { type: String, default: null },
    region: { type: String, default: null },
    synthetic: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.statics.ROLES = ROLES;

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never return passwordHash in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

applyPlugins('User', userSchema);

const User = mongoose.model('User', userSchema);
export { ROLES };
export default User;
