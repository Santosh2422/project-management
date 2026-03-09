// src/models/section.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface SectionDocument extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<SectionDocument>({
  name: { type: String, required: true, trim: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
}, { timestamps: true });

export const SectionModel = mongoose.model<SectionDocument>('Section', sectionSchema);
export default SectionModel;