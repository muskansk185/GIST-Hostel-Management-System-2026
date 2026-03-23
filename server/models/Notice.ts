import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel' }
}, { timestamps: true });

export default mongoose.model<INotice>('Notice', NoticeSchema);
