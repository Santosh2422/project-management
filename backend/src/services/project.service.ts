import { TaskStatusEnum } from '../enums/task.enum'; // Importing TaskStatusEnum for task status constants
import ProjectModel from '../models/project.model'; // Importing ProjectModel for database operations on projects
import TaskModel from '../models/task.model'; // Importing TaskModel for database operations on tasks
import SectionModel from '../models/sections.model';
import ProjectMemberModel from '../models/project-member.model';
import { BadRequestException, NotFoundException } from '../utils/appError';

// Service to create a new project
export const createProjectService = async (
  userId: string,
  workspaceId: string,
  body: { name: string; emoji?: string; description?: string }
) => {
  const project = new ProjectModel({
    ...(body.emoji && { emoji: body.emoji }),
    description: body.description,
    name: body.name,
    workspace: workspaceId,
    createdBy: userId,
  });

  await project.save();

  // --- NEW: ADD CREATOR AS PROJECT MEMBER ---
  const projectMember = new ProjectMemberModel({
    userId,
    projectId: project._id,
    workspaceId,
  });
  await projectMember.save();
  // ------------------------------------------

  // --- NEW: AUTOMATICALLY CREATE DEFAULT SECTION ---
  // This ensures the project has a container for tasks immediately.
  const defaultSection = new SectionModel({
    name: "Untitled Section",
    project: project._id,
    workspace: workspaceId,
  });

  await defaultSection.save();
  // ------------------------------------------------

  return { project, defaultSection };
};

// Service to get all projects in a workspace with pagination
export const getAllProjectsWorkspaceService = async (
  workspaceId: string, // ID of the workspace
  pageSize: number, // Number of projects per page
  pageNumber: number // Current page number
) => {
  const totalProjectsCount = await ProjectModel.countDocuments({
    workspace: workspaceId, // Count projects in the workspace
  });
  const skip = (pageNumber - 1) * pageSize; // Calculate documents to skip for pagination
  const projects = await ProjectModel.find({ workspace: workspaceId }) // Find projects in the workspace
    .skip(skip) // Skip documents for pagination
    .limit(pageSize) // Limit the number of documents
    .populate('createdBy', '_id name email profilePicture -password') // Populate creator details
    .sort({ createdAt: -1 }); // Sort projects by creation date in descending order
  const totalPages = Math.ceil(totalProjectsCount / pageSize); // Calculate total pages

  return { projects, totalProjectsCount, totalPages, skip }; // Return paginated projects and metadata
};

// Service to get a project by its ID and workspace ID
export const getProjectByIdAndWorkspaceIdService = async (
  workspaceId: string, // ID of the workspace
  projectId: string // ID of the project
) => {
  const project = await ProjectModel.findOne({
    workspace: workspaceId, // Match workspace ID
    _id: projectId, // Match project ID
  }).select('_id name emoji description createdBy')
    .populate('createdBy', '_id name email profilePicture -password'); // Select specific fields

  if (!project) {
    throw new NotFoundException(
      'Project not found or does not present in this workspace' // Throw error if project not found
    );
  }

  return { project }; // Return the project
};

// Service to get analytics for a project
export const getProjectAnalyticsService = async (
  projectId: string,
  workspaceId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId) {
    throw new NotFoundException(
      'Project not found or does not present in this workspace'
    );
  }

  const currentDae = new Date();
  const taskAnalytics = await TaskModel.aggregate([
    {
      $match: {
        project: project._id,
      },
    },
    {
      $facet: {
        totalTasks: [{ $count: 'count' }],
        overdueTask: [
          {
            $match: {
              dueDate: { $lt: currentDae },
              status: { $ne: TaskStatusEnum.DONE },
            },
          },
          { $count: 'count' },
        ],
        completedTasks: [
          {
            $match: {
              status: TaskStatusEnum.DONE,
            },
          },
          { $count: 'count' },
        ],
        pendingTasks: [
          {
            $match: {
              status: { $nin: [TaskStatusEnum.DONE, TaskStatusEnum.BACKLOG] },
            },
          },
          { $count: 'count' },
        ],
        tasksByPriority: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ],
        tasksByStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        tasksByUser: [
          {
            $group: {
              _id: '$assignedTo',
              count: { $sum: 1 },
            },
          },
        ],
        tasksDueToday: [
          {
            $match: {
              dueDate: { $eq: new Date().toISOString().split('T')[0] },
              status: { $ne: TaskStatusEnum.DONE },
            },
          },
          { $count: 'count' },
        ],
        completedOverTime: [
          {
            $match: {
              status: TaskStatusEnum.DONE,
              completedAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
              count: { $sum: 1 },
            },
          },
        ],
        averageCompletionTime: [
          {
            $match: {
              status: TaskStatusEnum.DONE,
            },
          },
          {
            $project: {
              completionTime: { $subtract: ['$completedAt', '$createdAt'] },
            },
          },
          {
            $group: {
              _id: null,
              averageTime: { $avg: '$completionTime' },
            },
          },
        ],
      },
    },
  ]);

  const _analytic = taskAnalytics[0];
  const analytics = {
    totalTasks: _analytic.totalTasks[0]?.count || 0,
    overdueTask: _analytic.overdueTask[0]?.count || 0,
    completedTasks: _analytic.completedTasks[0]?.count || 0,
    pendingTasks: _analytic.pendingTasks[0]?.count || 0,
    tasksByPriority: _analytic?.tasksByPriority,
    tasksByStatus: _analytic?.tasksByStatus,
    tasksByUser: _analytic?.tasksByUser,
    tasksDueToday: _analytic?.tasksDueToday[0]?.count || 0,
    completedOverTime: _analytic?.completedOverTime,
    averageCompletionTime: _analytic?.averageCompletionTime[0]?.averageTime || 0,
  };
  return { analytics };
};

// Service to update a project by its ID and workspace ID
export const updateProjectByIdAndWorkspaceIdService = async (
  workspaceId: string, // ID of the workspace
  projectId: string, // ID of the project
  body: { name: string; emoji?: string; description?: string } // Updated project details
) => {
  const { name, emoji, description } = body;

  const project = await ProjectModel.findOne({
    workspace: workspaceId, // Match workspace ID
    _id: projectId, // Match project ID
  });

  if (!project) {
    throw new NotFoundException(
      'Project not found or does not present in this workspace' // Throw error if project not found
    );
  }
  if (emoji) project.emoji = emoji; // Update emoji if provided

  if (description) project.description = description; // Update description if provided

  if (name) project.name = name; // Update name if provided

  await project.save(); // Save updated project to the database

  return { project }; // Return updated project
};

// Service to delete a project by its ID and workspace ID
export const deleteProjectByIdAndWorkspaceIdService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await ProjectModel.findOne({
    workspace: workspaceId,
    _id: projectId,
  });

  if (!project) {
    throw new NotFoundException(
      'Project not found or does not present in this workspace'
    );
  }

  // --- NEW: CLEANUP SECTIONS AND TASKS ---
  await project.deleteOne();
  await SectionModel.deleteMany({ project: projectId }); // Delete all sections in this project
  await TaskModel.deleteMany({ project: projectId }); // Delete all tasks (including subtasks) in this project
  await ProjectMemberModel.deleteMany({ projectId }); // Delete all project members

  return { project };
};

// --- NEW SERVICES ---

/**
 * Service to add a workspace member to a project
 */
export const addProjectMemberService = async (workspaceId: string, projectId: string, memberId: string, requesterId: string) => {
  const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw new NotFoundException('Project not found');
  }

  if (project.createdBy.toString() !== requesterId.toString()) {
    throw new BadRequestException('Only the project creator can add members');
  }

  const existingMember = await ProjectMemberModel.findOne({
    userId: memberId,
    projectId: project._id,
  });

  if (existingMember) {
    throw new BadRequestException('User is already a member of this project');
  }

  const newMember = new ProjectMemberModel({
    userId: memberId,
    projectId: project._id,
    workspaceId,
  });

  await newMember.save();

  return { project };
};

/**
 * Service to remove a member from a project
 */
export const removeProjectMemberService = async (workspaceId: string, projectId: string, memberId: string, requesterId: string) => {
  const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw new NotFoundException('Project not found');
  }

  if (project.createdBy.toString() !== requesterId.toString()) {
    throw new BadRequestException('Only the project creator can remove members');
  }

  if (project.createdBy.toString() === memberId) {
    throw new BadRequestException('Cannot remove the project creator from the project');
  }

  await ProjectMemberModel.findOneAndDelete({
    userId: memberId,
    projectId: project._id
  });

  return { message: 'Member removed successfully' };
};

/**
 * Service to get all members of a specific project
 */
export const getProjectMembersService = async (workspaceId: string, projectId: string) => {
  const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const members = await ProjectMemberModel.find({ projectId })
    .populate('userId', 'name email profilePicture')
    .sort({ joinedAt: 1 });

  return { members };
};

/**
 * Helper to check if a user is a member of a project
 */
export const checkProjectMembership = async (userId: string, projectId: string) => {
  // Fallback: If user is the project creator, they always have access
  const project = await ProjectModel.findById(projectId);
  if (project && project.createdBy.toString() === userId) {
    return true;
  }

  const isMember = await ProjectMemberModel.exists({ userId, projectId });
  return !!isMember;
};

