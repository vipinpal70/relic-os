import mongoose, { Schema, Document } from "mongoose";

export interface ICase extends Document {
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  bankId: mongoose.Types.ObjectId;
  channelPartnerId?: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
  status: "New" | "Pending" | "Approved" | "Rejected" | "Disbursed";
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

const CaseSchema = new Schema<ICase>(
  {
    applicationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    loanAmount: { type: Number, required: true, min: 0 },
    loanType: { type: String, required: true },
    bankId: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
    channelPartnerId: { type: Schema.Types.ObjectId, ref: "ChannelPartner" },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["New", "Pending", "Approved", "Rejected", "Disbursed"],
      default: "New",
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
CaseSchema.index({ status: 1 });
CaseSchema.index({ bankId: 1 });
CaseSchema.index({ channelPartnerId: 1 });
CaseSchema.index({ assignedUserId: 1 });
CaseSchema.index({ isDeleted: 1 });
CaseSchema.index({ createdAt: -1 });

// Compound Indexes for fast dashboard filtering
CaseSchema.index({ bankId: 1, status: 1, isDeleted: 1 });
CaseSchema.index({ channelPartnerId: 1, status: 1, isDeleted: 1 });
CaseSchema.index({ loanType: 1, status: 1 });

export default mongoose.models.Case || mongoose.model<ICase>("Case", CaseSchema);
