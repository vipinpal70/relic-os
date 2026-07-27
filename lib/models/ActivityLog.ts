import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  entityType: "Bank" | "ChannelPartner" | "Lead" | "AdLead" | "Commission" | "CommissionPayment" | "LoanType";
  entityId: mongoose.Types.ObjectId;
  action: string;
  details: string;
  performedBy: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    entityType: {
      type: String,
      enum: ["Bank", "ChannelPartner", "Lead", "AdLead", "Commission", "CommissionPayment", "LoanType"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    performedBy: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for fast lookup on profile pages
ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

// Allow updating model schema during dev HMR
if (mongoose.models.ActivityLog) {
  delete (mongoose.models as any).ActivityLog;
}

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
