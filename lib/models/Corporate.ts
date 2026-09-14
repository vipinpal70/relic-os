import mongoose, { Schema, Document } from "mongoose";
import { ICommissionRule } from "./Bank";

export interface ICorporate extends Document {
  corporateName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  address?: string;
  state?: string;
  city?: string;
  status: "Active" | "Inactive";
  notes?: string;
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

const CorporateSchema = new Schema<ICorporate>(
  {
    corporateName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gst: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    address: { type: String },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    notes: { type: String },
    commissionTable: { type: [CommissionRuleSchema], default: [] },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
CorporateSchema.index({ corporateName: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
CorporateSchema.index({ status: 1 });
CorporateSchema.index({ state: 1, city: 1 });
CorporateSchema.index({ isDeleted: 1 });

export default mongoose.models.Corporate || mongoose.model<ICorporate>("Corporate", CorporateSchema);
