import mongoose from 'mongoose';
import { institutionSearchTokens } from '../catalogue.js';

export default function institutionPickerPlugin(schema) {
  schema.add({
    city: { type: String, default: null },
    district: { type: String, default: null },
    establishedYear: { type: Number, default: null },
    intake: { type: Number, default: null },
    approvalValidUntil: { type: Date, default: null },
    icid: { type: String, default: null, match: /^IIC-[A-Z0-9]{8}$/ },
    pickerTokens: { type: [String], default: [], select: false },
    programmes: { type: [String], default: [] },
    coordinates: { type: mongoose.Schema.Types.Mixed, default: null },
    datasetName: { type: String, default: null },
    datasetVersion: { type: String, default: null },
  });
  schema.index({ name: 1 });
  schema.index({ state: 1 });
  schema.index({ city: 1 });
  schema.index({ icid: 1 });
  schema.index({ region: 1, state: 1, name: 1 });
  schema.index({ pickerTokens: 1, state: 1, region: 1 });
  schema.pre('validate', function () { this.pickerTokens = institutionSearchTokens(this); });
}
