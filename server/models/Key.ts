import mongoose, { Schema, Document } from 'mongoose';

export enum KeyStatus {
  IN_USE = 'IN_USE',
  AVAILABLE = 'AVAILABLE',
  LOST = 'LOST'
}

export interface IKey extends Document {
  keyNumber: string;
  hostelId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  status: KeyStatus;
  assignedTo?: mongoose.Types.ObjectId; // User ID of the student
}

const KeySchema: Schema = new Schema({
  keyNumber: { type: String, required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  status: { type: String, enum: Object.values(KeyStatus), default: KeyStatus.AVAILABLE },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

KeySchema.index({ keyNumber: 1, hostelId: 1 }, { unique: true });

export default mongoose.model<IKey>('Key', KeySchema);
