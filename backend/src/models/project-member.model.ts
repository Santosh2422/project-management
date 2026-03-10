import mongoose, { Document, Schema } from 'mongoose';

export interface ProjectMemberDocument extends Document {
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    joinedAt: Date;
}

const projectMemberSchema = new Schema<ProjectMemberDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
projectMemberSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const ProjectMemberModel = mongoose.model<ProjectMemberDocument>(
    'ProjectMember',
    projectMemberSchema
);

export default ProjectMemberModel;
