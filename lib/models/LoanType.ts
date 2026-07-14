import mongoose, { Schema, Document } from "mongoose";

export interface ILoanType extends Document {
  name: string;
  status: "Active" | "Inactive";
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LoanTypeSchema = new Schema<ILoanType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
LoanTypeSchema.index({ status: 1 });
LoanTypeSchema.index({ isDeleted: 1 });

export default mongoose.models.LoanType || mongoose.model<ILoanType>("LoanType", LoanTypeSchema);
