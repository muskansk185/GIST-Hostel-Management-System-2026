import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  personalDetails: {
    rollNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    year: string;
    gender: string;
    dob: string;
    phone: string;
    email: string;
  };
  parentDetails: {
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  };
  guardianDetails: {
    guardianName: string;
    guardianPhone: string;
    guardianRelation: string;
  };
  address: {
    permanentAddress: string;
    currentAddress: string;
  };
  profilePicture?: string;
  hostelId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  blockId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  bedId?: mongoose.Types.ObjectId;
  accommodationStatus?: "HOSTELLER" | "DAY_SCHOLAR";
}

const StudentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personalDetails: {
    rollNumber: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    gender: { type: String },
    dob: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  parentDetails: {
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String, required: true }
  },
  guardianDetails: {
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianRelation: { type: String, required: true }
  },
  address: {
    permanentAddress: { type: String, required: true },
    currentAddress: { type: String, required: true }
  },
  profilePicture: { type: String },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel' },
  parentId: { type: Schema.Types.ObjectId, ref: 'User' },
  blockId: { type: Schema.Types.ObjectId, ref: 'Block' },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  bedId: { type: Schema.Types.ObjectId, ref: 'Bed' },
  accommodationStatus: {
  type: String,
  enum: ["HOSTELLER", "DAY_SCHOLAR"],
  default: "DAY_SCHOLAR"
  }
}, { timestamps: true });

export default mongoose.model<IStudent>('Student', StudentSchema);
