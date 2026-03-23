import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  floorId: mongoose.Types.ObjectId;
  capacity: number;
}

const RoomSchema: Schema = new Schema({
  roomNumber: { type: String, required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  capacity: { type: Number, required: true, min: 1 }
}, { timestamps: true });

RoomSchema.index({ roomNumber: 1, floorId: 1 }, { unique: true });
RoomSchema.index({ floorId: 1 });

export default mongoose.model<IRoom>('Room', RoomSchema);
