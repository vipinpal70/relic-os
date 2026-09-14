import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceLineItem {
  leadId: mongoose.Types.ObjectId;
  applicationNumber: string;
  applicantName: string;
  loanType: string;
  loanAmount: number;
  disbursedAmount: number;
  rate: number;
  commissionType: "Fixed" | "Percentage";
  commissionAmount: number;
}

export interface IInvoiceEntitySnapshot {
  name: string;
  branch?: string;
  ifsc?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gst?: string;
  pan?: string;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  entityType: "Bank" | "ChannelPartner" | "Corporate";
  entityId: mongoose.Types.ObjectId;
  // Snapshots keep the invoice an immutable historical record even if the
  // entity or its leads are edited later.
  entitySnapshot: IInvoiceEntitySnapshot;
  invoiceDate: string; // YYYY-MM-DD
  periodStart?: string; // YYYY-MM-DD
  periodEnd?: string; // YYYY-MM-DD
  lineItems: IInvoiceLineItem[];
  totalApplications: number;
  totalLoanAmount: number;
  totalDisbursedAmount: number;
  commissionSubtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: "Generated" | "Sent" | "Paid" | "Cancelled";
  paidDate?: string; // YYYY-MM-DD
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<IInvoiceLineItem>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    applicationNumber: { type: String, required: true },
    applicantName: { type: String, required: true },
    loanType: { type: String, required: true },
    loanAmount: { type: Number, required: true, min: 0 },
    disbursedAmount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    commissionType: { type: String, enum: ["Fixed", "Percentage"], required: true },
    commissionAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    entityType: { type: String, enum: ["Bank", "ChannelPartner", "Corporate"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, refPath: "entityType" },
    entitySnapshot: {
      name: { type: String, required: true },
      branch: { type: String },
      ifsc: { type: String },
      email: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      gst: { type: String },
      pan: { type: String },
    },
    invoiceDate: { type: String, required: true },
    periodStart: { type: String },
    periodEnd: { type: String },
    lineItems: { type: [LineItemSchema], required: true },
    totalApplications: { type: Number, required: true, min: 0 },
    totalLoanAmount: { type: Number, required: true, min: 0 },
    totalDisbursedAmount: { type: Number, required: true, min: 0 },
    commissionSubtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Generated", "Sent", "Paid", "Cancelled"],
      default: "Generated",
    },
    paidDate: { type: String },
    notes: { type: String },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
InvoiceSchema.index({ entityType: 1, entityId: 1, isDeleted: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
