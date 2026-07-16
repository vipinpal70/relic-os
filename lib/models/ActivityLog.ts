import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  entityType: "Bank" | "ChannelPartner" | "Lead" | "Commission" | "CommissionPayment" | "LoanType";
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
      enum: ["Bank", "ChannelPartner", "Lead", "Commission", "CommissionPayment", "LoanType"],
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

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
