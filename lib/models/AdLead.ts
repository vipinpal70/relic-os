import mongoose, { Schema, Document } from "mongoose";

export interface IAdLead extends Document {
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  bankId?: mongoose.Types.ObjectId;
  channelPartnerId?: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
  status: string;
  disbursedAmount: number;
  approvedDate?: string;
  disbursedDate?: string;
  
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

const AdLeadSchema = new Schema<IAdLead>(
  {
    applicationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    loanAmount: { type: Number, required: true, min: 0 },
    loanType: { type: String, required: true },
    bankId: { type: Schema.Types.ObjectId, ref: "Bank" },
    channelPartnerId: { type: Schema.Types.ObjectId, ref: "ChannelPartner" },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
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
AdLeadSchema.index({ status: 1 });
AdLeadSchema.index({ isDeleted: 1 });
AdLeadSchema.index({ createdAt: -1 });

export default mongoose.models.AdLead || mongoose.model<IAdLead>("AdLead", AdLeadSchema);
