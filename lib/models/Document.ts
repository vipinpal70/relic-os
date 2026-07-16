import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  entityType: "Bank" | "ChannelPartner" | "Lead";
  entityId: mongoose.Types.ObjectId;
  name: string;
  fileUrl: string;
  fileType: string; // e.g. "PAN", "GST", "Agreement", "Invoice", "Other"
  fileSize: number;  // in bytes
  uploadedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    entityType: { type: String, enum: ["Bank", "ChannelPartner", "Lead"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true, default: "Other" },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
DocumentSchema.index({ entityType: 1, entityId: 1 });
DocumentSchema.index({ isDeleted: 1 });

export default mongoose.models.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);
