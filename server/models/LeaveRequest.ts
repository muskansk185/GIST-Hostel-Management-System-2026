import mongoose, { Schema, Document } from 'mongoose';

export enum LeaveStatus {
  PENDING_PARENT = 'PENDING_PARENT',
  PENDING_HOD = 'PENDING_HOD',
  PENDING_WARDEN = 'PENDING_WARDEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ILeaveRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  rollNumber: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  emergencyContact: string;
  status: LeaveStatus;
  parentApprovalAt?: Date;
  hodApprovalAt?: Date;
  wardenApprovalAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  rollNumber: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  status: { type: String, enum: Object.values(LeaveStatus), default: LeaveStatus.PENDING_PARENT },
  parentApprovalAt: { type: Date },
  hodApprovalAt: { type: Date },
  wardenApprovalAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

LeaveRequestSchema.index({ studentId: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ fromDate: 1, toDate: 1 });

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
