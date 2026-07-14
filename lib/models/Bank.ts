import mongoose, { Schema, Document } from "mongoose";

export interface ICommissionRule {
  loanType: string;
  commissionValue: number;
  commissionType: "Fixed" | "Percentage";
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string;  // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
}

export interface IBank extends Document {
  bankName: string;
  branch: string;
  ifsc: string;
  managerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  city?: string;
  status: "Active" | "Inactive";
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

const BankSchema = new Schema<IBank>(
  {
    bankName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    ifsc: { type: String, required: true, trim: true, uppercase: true },
    managerName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    commissionTable: { type: [CommissionRuleSchema], default: [] },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
BankSchema.index({ bankName: 1, branch: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
BankSchema.index({ status: 1 });
BankSchema.index({ state: 1, city: 1 });
BankSchema.index({ isDeleted: 1 });

export default mongoose.models.Bank || mongoose.model<IBank>("Bank", BankSchema);
