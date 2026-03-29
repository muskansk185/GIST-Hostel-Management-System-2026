import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  maintenanceMode: boolean;
  message: string;
}

const SystemSettingsSchema: Schema = new Schema({
  maintenanceMode: { type: Boolean, default: false },
  message: { type: String, default: 'System is currently under maintenance. Please try again later.' }
}, { timestamps: true });

export default mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
