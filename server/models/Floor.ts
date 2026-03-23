import mongoose, { Schema, Document } from 'mongoose';

export interface IFloor extends Document {
  floorNumber: number;
  blockId: mongoose.Types.ObjectId;
}

const FloorSchema: Schema = new Schema({
  floorNumber: { type: Number, required: true },
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true }
}, { timestamps: true });

FloorSchema.index({ blockId: 1, floorNumber: 1 }, { unique: true });

export default mongoose.model<IFloor>('Floor', FloorSchema);
