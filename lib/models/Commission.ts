import mongoose, { Schema, Document } from "mongoose";

export interface ICommission extends Document {
  caseId: mongoose.Types.ObjectId;
  entityType: "Bank" | "ChannelPartner";
  entityId: mongoose.Types.ObjectId;
  rate: number;
  commissionType: "Fixed" | "Percentage";
  expectedCommission: number;
  paidCommission: number;
  pendingCommission: number;
  status: "Unpaid" | "Partially Paid" | "Paid";
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true },
    entityType: { type: String, enum: ["Bank", "ChannelPartner"], required: true },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
    },
    rate: { type: Number, required: true, min: 0 },
    commissionType: { type: String, enum: ["Fixed", "Percentage"], default: "Percentage" },
    expectedCommission: { type: Number, required: true, min: 0 },
    paidCommission: { type: Number, default: 0, min: 0 },
    pendingCommission: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
CommissionSchema.index({ caseId: 1 });
CommissionSchema.index({ entityType: 1, entityId: 1 });
CommissionSchema.index({ status: 1 });
CommissionSchema.index({ isDeleted: 1 });
CommissionSchema.index({ caseId: 1, entityType: 1 }, { unique: true });

export default mongoose.models.Commission ||
  mongoose.model<ICommission>("Commission", CommissionSchema);
