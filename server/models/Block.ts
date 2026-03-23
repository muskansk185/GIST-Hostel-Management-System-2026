import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  name: string;
  hostelId: mongoose.Types.ObjectId;
}

const BlockSchema: Schema = new Schema({
  name: { type: String, required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true }
}, { timestamps: true });

BlockSchema.index({ hostelId: 1, name: 1 }, { unique: true });

export default mongoose.model<IBlock>('Block', BlockSchema);
