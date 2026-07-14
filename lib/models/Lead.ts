import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  google_form_id?: string;
  applicant_name: string;
  email: string;
  phone: string;
  loan_amount: number;
  loan_type: string;
  bank?: string;
  channel_partner?: string;
  assigned_user?: string;
  lead_source: string;
  application_number: string;
  status: string;
  disbursed_amount: number;
  approved_date?: string;
  disbursed_date?: string;
  remarks?: string;
  created_at: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    google_form_id: { type: String, default: "" },
    applicant_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    loan_amount: { type: Number, required: true },
    loan_type: { type: String, required: true },
    bank: { type: String, default: "" },
    channel_partner: { type: String, default: "" },
    assigned_user: { type: String, default: "" },
    lead_source: { type: String, default: "Manual" },
    application_number: { type: String, required: true, unique: true },
    status: { type: String, default: "New" },
    disbursed_amount: { type: Number, default: 0 },
    approved_date: { type: String, default: "" },
    disbursed_date: { type: String, default: "" },
    remarks: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
