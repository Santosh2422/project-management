// src/models/task.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
  TaskTypeEnum,
  TaskTypeEnumType,
} from '../enums/task.enum';
import { generateTaskCode } from '../utils/uuid';

export interface TaskDocument extends Document {
  taskcode: string;
  title: string;
  description: string | null;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: TaskStatusEnumType;
  priority: TaskPriorityEnumType;
  type: TaskTypeEnumType;
  dueDate: Date;
  parentId: mongoose.Types.ObjectId | null; // <-- NEW: Used to identify subtasks
  section: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    taskcode: {
      type: String,
      required: true,
      unique: true,
      default: generateTaskCode,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatusEnum),
      default: TaskStatusEnum.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriorityEnum),
      default: TaskPriorityEnum.MEDIUM,
    },
    type: {
      type: String,
      enum: Object.values(TaskTypeEnum),
      default: TaskTypeEnum.TASK,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Task', // <-- NEW: Self-referencing the Task model
      default: null,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      default: null, // Subtasks won't need a section, so we allow null
    },
  },
  {
    timestamps: true,
  }
);

export const TaskModel = mongoose.model<TaskDocument>('Task', taskSchema);
export default TaskModel;