import mongoose, { Schema, Document } from "mongoose";

export interface ICommissionRate extends Document {
  type: "Channel Partner" | "Bank";
  partner: string;
  loan_type: string;
  rate: number;
  effective_from: string;
  effective_to?: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRateSchema: Schema = new Schema(
  {
    type: { type: String, required: true, enum: ["Channel Partner", "Bank"] },
    partner: { type: String, required: true },
    loan_type: { type: String, required: true },
    rate: { type: Number, required: true },
    effective_from: { type: String, required: true },
    effective_to: { type: String },
    status: { type: String, required: true, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.models.CommissionRate ||
  mongoose.model<ICommissionRate>("CommissionRate", CommissionRateSchema);
