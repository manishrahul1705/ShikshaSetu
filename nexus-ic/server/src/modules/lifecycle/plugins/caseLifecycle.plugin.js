import mongoose from 'mongoose';

/**
 * Case Lifecycle Schema Plugin (SPEC Section 9.1, Section 15.1, N28, S02)
 *
 * Adds the four parallel tracks:
 * 1. case status (Registered, Assigned, Under Process, etc.)
 * 2. transferStatus
 * 3. currentOwner
 * 4. slaClock with escalation
 *
 * Plus sensitivityFlags, analyticStatus (F09), and transfer history.
 */
export default function caseLifecyclePlugin(schema) {
  schema.add({
    transferStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'ACCEPTED', 'REJECTED'],
      default: 'NONE',
      index: true,
    },
    currentOwner: {
      office: { type: String, default: null },
      role: { type: String, default: null },
      officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      officerName: { type: String, default: null },
      assignedAt: { type: Date, default: null },
    },
    lastAccountableOwner: {
      office: { type: String, default: null },
      role: { type: String, default: null },
      officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      officerName: { type: String, default: null },
      at: { type: Date, default: null },
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    slaClock: [
      {
        segmentId: { type: String, required: true },
        ruleVersion: { type: String, required: true },
        priority: { type: String, required: true },
        startedAt: { type: Date, default: Date.now },
        targetResolutionDate: { type: Date, required: true },
        nearDueDate: { type: Date, default: null },
        endedAt: { type: Date, default: null },
        status: {
          type: String,
          enum: ['RUNNING', 'PAUSED', 'COMPLETED', 'ESCALATED'],
          default: 'RUNNING',
        },
      },
    ],
    sensitivityFlags: [
      {
        flag: { type: String, required: true },
        keyword: { type: String, default: null },
        detectedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['SUGGESTED', 'CONFIRMED', 'DISMISSED'],
          default: 'SUGGESTED',
        },
        confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        confirmedAt: { type: Date, default: null },
        suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        dismissalReason: { type: String, default: null },
      },
    ],
    analyticStatus: {
      type: String,
      enum: ['PENDING', 'IN_PROCESS', 'DISPOSED'],
      default: 'PENDING',
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    transferHistory: [
      {
        fromBureau: { type: String, required: true },
        toBureau: { type: String, required: true },
        requestedAt: { type: Date, default: Date.now },
        acknowledgedAt: { type: Date, default: null },
        status: { type: String, enum: ['REQUESTED', 'ACCEPTED', 'REJECTED'], default: 'REQUESTED' },
        reason: { type: String, default: null },
        officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
    routingHistory: [
      {
        routingDecisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingDecision' },
        action: { type: String, required: true },
        routedAt: { type: Date, default: Date.now },
        reason: { type: String, default: null },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
  });
}
