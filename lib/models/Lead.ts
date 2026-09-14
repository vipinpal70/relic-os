import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  bankId: mongoose.Types.ObjectId;
  channelPartnerId?: mongoose.Types.ObjectId;
  corporateId?: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
  status: "Underwriting" | "Sanctioned" | "Reject" | "PDD" | "Not Interested" | "Disbursed" | "Not Contactable" | "New" | "Assigned" | "Not Connected" | "Document Pending" | "Processing" | "Approved" | "Rejected" | "Pending" | "Not Intrested";
  disbursedAmount: number;
  approvedDate?: string;
  disbursedDate?: string;
  
  // Commission summary for quick access/indexing
  bankExpectedCommission: number;
  bankPaidCommission: number;
  bankPendingCommission: number;
  
  partnerExpectedCommission: number;
  partnerPaidCommission: number;
  partnerPendingCommission: number;

  remarks?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    applicationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    loanAmount: { type: Number, required: true, min: 0 },
    loanType: { type: String, required: true },
    bankId: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
    channelPartnerId: { type: Schema.Types.ObjectId, ref: "ChannelPartner" },
    corporateId: { type: Schema.Types.ObjectId, ref: "Corporate" },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "Underwriting", "Sanctioned", "Reject", "PDD", "Not Interested", "Disbursed", "Not Contactable",
        "Not Intrested", "Rejected", "New", "Assigned", "Not Connected",
        "Document Pending", "Processing", "Approved",
        "Pending", // legacy value — mapped to Processing in API responses
      ],
      default: "Underwriting",
    },
    disbursedAmount: { type: Number, default: 0 },
    approvedDate: { type: String },
    disbursedDate: { type: String },

    bankExpectedCommission: { type: Number, default: 0 },
    bankPaidCommission: { type: Number, default: 0 },
    bankPendingCommission: { type: Number, default: 0 },

    partnerExpectedCommission: { type: Number, default: 0 },
    partnerPaidCommission: { type: Number, default: 0 },
    partnerPendingCommission: { type: Number, default: 0 },

    remarks: { type: String },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
LeadSchema.index({ status: 1 });
LeadSchema.index({ bankId: 1 });
LeadSchema.index({ channelPartnerId: 1 });
LeadSchema.index({ corporateId: 1 });
LeadSchema.index({ assignedUserId: 1 });
LeadSchema.index({ isDeleted: 1 });
LeadSchema.index({ createdAt: -1 });

// Compound Indexes for fast dashboard filtering
LeadSchema.index({ bankId: 1, status: 1, isDeleted: 1 });
LeadSchema.index({ channelPartnerId: 1, status: 1, isDeleted: 1 });
LeadSchema.index({ loanType: 1, status: 1 });

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
