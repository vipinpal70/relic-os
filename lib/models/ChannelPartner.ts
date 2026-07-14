import mongoose, { Schema, Document } from "mongoose";
import { ICommissionRule } from "./Bank";

export interface IChannelPartner extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address?: string;
  state?: string;
  city?: string;
  gst?: string;
  pan?: string;
  status: "Active" | "Inactive";
  notes?: string;
  profileImage?: string;
  commissionTable: ICommissionRule[];
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRuleSchema = new Schema<ICommissionRule>({
  loanType: { type: String, required: true },
  commissionValue: { type: Number, required: true, min: 0 },
  commissionType: { type: String, enum: ["Fixed", "Percentage"], default: "Percentage" },
  effectiveFrom: { type: String, required: true },
  effectiveTo: { type: String },
  minAmount: { type: Number, default: 0 },
  maxAmount: { type: Number, default: 999999999 },
});

const ChannelPartnerSchema = new Schema<IChannelPartner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    alternativePhone: { type: String, trim: true },
    address: { type: String },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    gst: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    notes: { type: String },
    profileImage: { type: String },
    commissionTable: { type: [CommissionRuleSchema], default: [] },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
ChannelPartnerSchema.index({ status: 1 });
ChannelPartnerSchema.index({ state: 1, city: 1 });
ChannelPartnerSchema.index({ isDeleted: 1 });

export default mongoose.models.ChannelPartner ||
  mongoose.model<IChannelPartner>("ChannelPartner", ChannelPartnerSchema);
