import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document<string> {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * Atomically increments and returns the next value of a named sequence.
 * Safe under concurrent requests (single findOneAndUpdate with $inc + upsert).
 */
export async function getNextSequence(key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
