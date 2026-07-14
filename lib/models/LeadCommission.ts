import mongoose, { Schema, Document } from "mongoose";

export interface ILeadCommission extends Document {
  leadId: mongoose.Types.ObjectId;
  payoutRate: number; // e.g. 1.5%
  payoutAmount: number; // in INR
  commissionType: "Bank" | "Partner";
  status: "Unpaid" | "Paid" | "Processing";
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadCommissionSchema = new Schema<ILeadCommission>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, unique: true },
  payoutRate: { type: Number, default: 1.5 },
  payoutAmount: { type: Number, default: 0 },
  commissionType: { type: String, enum: ["Bank", "Partner"], default: "Bank" },
  status: { type: String, enum: ["Unpaid", "Paid", "Processing"], default: "Unpaid" },
  updatedBy: { type: String, default: "System" },
}, { timestamps: true });

export default mongoose.models.LeadCommission || mongoose.model<ILeadCommission>("LeadCommission", LeadCommissionSchema);
