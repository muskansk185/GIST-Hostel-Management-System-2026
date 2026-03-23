import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'], default: 'INFO' },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<IAlert>('Alert', AlertSchema);
