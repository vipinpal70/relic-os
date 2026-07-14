import mongoose, { Schema, Document } from "mongoose";

export interface ILeadActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  action: string; // e.g. "Status Updated", "Lead Created", "Document Uploaded", "Remarks Added"
  new_value?: string; // e.g. "Processing"
  remarks?: string; // custom description
  user: string; // e.g. "Vikash Sharma" (the user who logged the activity)
  created_at: Date;
}

const LeadActivitySchema = new Schema<ILeadActivity>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  action: { type: String, required: true },
  new_value: { type: String, default: "" },
  remarks: { type: String, default: "" },
  user: { type: String, required: true, default: "System" },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.LeadActivity || mongoose.model<ILeadActivity>("LeadActivity", LeadActivitySchema);
