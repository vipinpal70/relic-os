import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  systemName: string;
  organizationName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    systemName: { type: String, default: "Relic OS", trim: true },
    organizationName: { type: String, default: "Elevana Consultancy", trim: true },
    timezone: { type: String, default: "Asia/Kolkata (IST)", trim: true },
    dateFormat: { type: String, default: "DD/MM/YYYY", trim: true },
    currency: { type: String, default: "INR (₹)", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
