import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  googleSheetUrl: string;
  syncInterval: string; // e.g. "every_hour", "every_2_hours", "every_4_hours"
  isActive: boolean;
  lastSyncStatus: "success" | "failed" | "never";
  lastSyncTime?: Date;
  lastSyncError?: string;
  recordsImportedInLastRun: number;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    googleSheetUrl: { type: String, default: "" },
    syncInterval: { type: String, default: "every_2_hours" },
    isActive: { type: Boolean, default: false },
    lastSyncStatus: { type: String, enum: ["success", "failed", "never"], default: "never" },
    lastSyncTime: { type: Date },
    lastSyncError: { type: String },
    recordsImportedInLastRun: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Integration || mongoose.model<IIntegration>("Integration", IntegrationSchema);
