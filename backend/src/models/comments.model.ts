// src/models/comment.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface CommentDocument extends Document {
  content: string;
  taskId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CommentModel = mongoose.model<CommentDocument>('Comment', commentSchema);
export default CommentModel;