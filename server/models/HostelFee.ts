import mongoose, { Schema, Document } from 'mongoose';

export enum FeeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface IHostelFee extends Document {
  studentId: mongoose.Types.ObjectId;
  rollNumber: string;
  feeName: string;
  amount: number;
  dueDate: Date;
  status: FeeStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HostelFeeSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  rollNumber: { type: String, required: true },
  feeName: { type: String, required: true, default: 'Hostel Fee' },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(FeeStatus), default: FeeStatus.PENDING },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

HostelFeeSchema.index({ studentId: 1 });
HostelFeeSchema.index({ status: 1 });
HostelFeeSchema.index({ dueDate: 1 });
HostelFeeSchema.index({ razorpayOrderId: 1 });

export default mongoose.model<IHostelFee>('HostelFee', HostelFeeSchema);
