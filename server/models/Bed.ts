import mongoose, { Schema, Document } from 'mongoose';

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface IBed extends Document {
  bedNumber: string;
  roomId: mongoose.Types.ObjectId;
  status: BedStatus;
  studentId?: mongoose.Types.ObjectId;
}

const BedSchema: Schema = new Schema({
  bedNumber: { type: String, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  status: { type: String, enum: Object.values(BedStatus), default: BedStatus.AVAILABLE },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student' }
}, { timestamps: true });

BedSchema.index({ bedNumber: 1, roomId: 1 }, { unique: true });
BedSchema.index({ studentId: 1 });
BedSchema.index({ roomId: 1 });
BedSchema.index({ status: 1 });

export default mongoose.model<IBed>('Bed', BedSchema);
