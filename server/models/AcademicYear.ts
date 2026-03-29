import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicYear extends Document {
  year: string;
  isActive: boolean;
}

const AcademicYearSchema: Schema = new Schema({
  year: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAcademicYear>('AcademicYear', AcademicYearSchema);
