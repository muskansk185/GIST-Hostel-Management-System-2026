import mongoose, { Schema, Document } from 'mongoose';

export interface IAccommodationHistory extends Document {
  studentId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  blockId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  assignedAt: Date;
  vacatedAt?: Date;
  assignedBy: mongoose.Types.ObjectId;
}

const AccommodationHistorySchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  blockId: { type: Schema.Types.ObjectId, ref: 'Block', required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
  assignedAt: { type: Date, default: Date.now, required: true },
  vacatedAt: { type: Date },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AccommodationHistorySchema.index({ studentId: 1 });
AccommodationHistorySchema.index({ bedId: 1 });
AccommodationHistorySchema.index({ assignedAt: -1 });

export default mongoose.model<IAccommodationHistory>('AccommodationHistory', AccommodationHistorySchema);
