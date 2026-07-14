import mongoose, { Schema, Document } from "mongoose";

export interface ILeadDocument extends Document {
  leadId: mongoose.Types.ObjectId;
  name: string; // file name
  folder: "KYC" | "Loan Application" | "Other";
  url: string; // file link/path
  uploadedBy: string; // e.g. "Priya Nair"
  createdAt: Date;
}

const LeadDocumentSchema = new Schema<ILeadDocument>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  name: { type: String, required: true },
  folder: { type: String, enum: ["KYC", "Loan Application", "Other"], required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true, default: "System" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.LeadDocument || mongoose.model<ILeadDocument>("LeadDocument", LeadDocumentSchema);
