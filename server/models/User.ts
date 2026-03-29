import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  WARDEN = 'WARDEN',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  HOD = 'HOD'
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  phone?: string;
  isActive: boolean;
  studentIds?: mongoose.Types.ObjectId[];
  department?: string;
  hostelId?: mongoose.Types.ObjectId;
  profilePicture?: string;
  hostelHistory: {
    hostel: mongoose.Types.ObjectId;
    assignedFrom: Date;
    assignedTo: Date | null;
  }[];
}

export interface IHostelHistory {
  hostel: mongoose.Types.ObjectId;
  assignedFrom: Date;
  assignedTo: Date | null;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  name: { type: String, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  department: { type: String },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel' },
  profilePicture: { type: String },
  hostelHistory: [{
    hostel: { type: Schema.Types.ObjectId, ref: 'Hostel' },
    assignedFrom: { type: Date, default: Date.now },
    assignedTo: { type: Date, default: null }
  }]
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
