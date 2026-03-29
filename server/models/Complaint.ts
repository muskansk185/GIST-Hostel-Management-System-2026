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
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved'
}

export enum ComplaintUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface IStatusHistory {
  status: string;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  note?: string;
}

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  title: string;
  description: string;
  status: ComplaintStatus;
  currentStatus: string;
  statusHistory: IStatusHistory[];
  urgency: ComplaintUrgency;
  expectedResolutionTime: Date;
  assignedTo?: mongoose.Types.ObjectId;
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
  status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.PENDING },
  currentStatus: { type: String, default: 'raised' },
  statusHistory: [{
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String }
  }],
  urgency: { type: String, enum: Object.values(ComplaintUrgency), default: ComplaintUrgency.LOW },
  expectedResolutionTime: { type: Date },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedStaff: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

ComplaintSchema.index({ studentId: 1 });
ComplaintSchema.index({ roomId: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ urgency: 1 });
ComplaintSchema.index({ createdAt: 1 });

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
