import mongoose, { Schema, Document } from "mongoose";

export interface ICommissionPayment extends Document {
  commissionId: mongoose.Types.ObjectId;
  caseId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMode: "NEFT" | "RTGS" | "IMPS" | "UPI" | "Cheque" | "Cash";
  referenceNumber: string; // UTR Number / Transaction ID
  invoiceNumber?: string;
  remarks?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionPaymentSchema = new Schema<ICommissionPayment>(
  {
    commissionId: { type: Schema.Types.ObjectId, ref: "Commission", required: true },
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: String, required: true },
    paymentMode: {
      type: String,
      enum: ["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash"],
      required: true,
    },
    referenceNumber: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, trim: true },
    remarks: { type: String },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
CommissionPaymentSchema.index({ commissionId: 1 });
CommissionPaymentSchema.index({ caseId: 1 });
CommissionPaymentSchema.index({ referenceNumber: 1 });
CommissionPaymentSchema.index({ isDeleted: 1 });

export default mongoose.models.CommissionPayment ||
  mongoose.model<ICommissionPayment>("CommissionPayment", CommissionPaymentSchema);
