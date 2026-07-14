import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "Team" | "Channel Partner";
  phone?: string;
  status: "Active" | "Inactive";
  tag?: string;
  assigned_partner?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Team", "Channel Partner"], default: "Team" },
    phone: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    tag: { type: String },
    assigned_partner: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
