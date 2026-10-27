/**
 * Case plugin (S5, N35): queue a minimal status notice after every status
 * change on an existing case, whichever module made it. Creation is not a
 * status change. The notice module is loaded lazily so the Case model does not
 * import it at compile time.
 */
export default function statusNoticePlugin(schema) {
  schema.pre('save', function (next) {
    this.$locals.s5StatusChanged = !this.isNew && this.isModified('status');
    next();
  });

  schema.post('save', async function (doc) {
    if (!doc.$locals?.s5StatusChanged) return;
    doc.$locals.s5StatusChanged = false;
    const { onStatusChanged } = await import('../noticeService.js');
    await onStatusChanged(doc);
  });

  schema.post('findOneAndUpdate', async function (doc) {
    const update = this.getUpdate() || {};
    const status = update.status ?? update.$set?.status;
    if (!doc?._id || !status) return;
    try {
      const fresh = await this.model.findById(doc._id);
      if (!fresh) return;
      const { onStatusChanged } = await import('../noticeService.js');
      await onStatusChanged(fresh);
    } catch {
      // Never fail another module's update because of a notice.
    }
  });
}
