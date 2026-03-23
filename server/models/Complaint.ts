import mongoose, { Schema, Document } from 'mongoose';

export enum ComplaintCategory {
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  CLEANING = 'CLEANING',
  INTERNET = 'INTERNET',
  FURNITURE = 'FURNITURE',
  OTHER = 'OTHER'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedStaff?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
  category: { type: String, enum: Object.values(ComplaintCategory), required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.OPEN },
  priority: { type: String, enum: Object.values(ComplaintPriority), default: ComplaintPriority.LOW },
  assignedStaff: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

ComplaintSchema.index({ studentId: 1 });
ComplaintSchema.index({ roomId: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ createdAt: 1 });

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
