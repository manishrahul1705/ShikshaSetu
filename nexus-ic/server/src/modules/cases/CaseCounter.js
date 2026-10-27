import mongoose from 'mongoose';

const caseCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const CaseCounter = mongoose.model('CaseCounter', caseCounterSchema);
export default CaseCounter;
