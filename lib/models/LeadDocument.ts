import mongoose, { Schema, Document } from "mongoose";

export type DocumentFolder = "KYC" | "Bank Documents" | "Financial Documents" | "Property Documents" | "Other";

export interface ILeadDocument extends Document {
  leadId: mongoose.Types.ObjectId;
  name: string;
  folder: DocumentFolder;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

const DOCUMENT_FOLDERS: DocumentFolder[] = ["KYC", "Bank Documents", "Financial Documents", "Property Documents", "Other"];

const LeadDocumentSchema = new Schema<ILeadDocument>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  name: { type: String, required: true },
  folder: { type: String, enum: DOCUMENT_FOLDERS, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true, default: "System" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.LeadDocument || mongoose.model<ILeadDocument>("LeadDocument", LeadDocumentSchema);
