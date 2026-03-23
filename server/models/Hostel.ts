import mongoose, { Schema, Document } from 'mongoose';

export enum HostelType {
  BOYS = 'BOYS',
  GIRLS = 'GIRLS',
  MIXED = 'MIXED'
}

export interface IHostel extends Document {
  name: string;
  type: HostelType;
  capacity: number;
  wardenId?: mongoose.Types.ObjectId;
  description?: string;
}

const HostelSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: Object.values(HostelType), required: true, default: HostelType.BOYS },
  capacity: { type: Number, required: true, default: 0 },
  wardenId: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model<IHostel>('Hostel', HostelSchema);
