import mongoose from 'mongoose';
import { CLOSED_STATUSES } from '../../lifecycle/lifecycleGuards.js';

/**
 * Case plugin (S5, N22): the PROOF closure gate cannot be bypassed.
 *
 * Closure is a human action that the system blocks until the gate passes
 * (SPEC 10.1). Any save or query update that moves an existing case to a
 * closed status is refused unless it comes from the PROOF close action,
 * which sets $locals.s5ClosureGate (save) or the s5ClosureGate query option.
 * Creating a case that is already closed (historical import) is not a closure
 * in this system and is left alone.
 */
const CLOSED = CLOSED_STATUSES;

function gateError() {
  const err = new Error('CLOSURE_GATE_REQUIRED');
  err.status = 409;
  err.code = 'CLOSURE_GATE_REQUIRED';
  return err;
}

export default function closureGatePlugin(schema) {
  schema.add({
    closureRecordId: { type: mongoose.Schema.Types.ObjectId, default: null },
  });

  schema.pre('save', function (next) {
    if (!this.isNew && this.isModified('status') && CLOSED.includes(this.status) && this.$locals?.s5ClosureGate !== true) {
      return next(gateError());
    }
    next();
  });

  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'], function (next) {
    const update = this.getUpdate() || {};
    const status = update.status ?? update.$set?.status;
    if (status && CLOSED.includes(status) && this.getOptions().s5ClosureGate !== true) {
      return next(gateError());
    }
    next();
  });
}
