import mongoose, { Schema, Document } from "mongoose";

export interface ITeamProfile extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  department: string;
  designation: string;
  reportingManagerId?: mongoose.Types.ObjectId;
  pan?: string;
  aadhaar?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamProfileSchema = new Schema<ITeamProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    department: { type: String, trim: true, default: "Sales" },
    designation: { type: String, trim: true, default: "Relationship Manager" },
    reportingManagerId: { type: Schema.Types.ObjectId, ref: "User" },
    pan: { type: String, trim: true, uppercase: true },
    aadhaar: { type: String, trim: true },
    bankAccountNumber: { type: String, trim: true },
    bankIfsc: { type: String, trim: true, uppercase: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.TeamProfile || mongoose.model<ITeamProfile>("TeamProfile", TeamProfileSchema);
