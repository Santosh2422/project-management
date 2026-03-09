import SectionModel from '../models/sections.model';
import ProjectModel from '../models/project.model';
import TaskModel from '../models/task.model';
import { NotFoundException } from '../utils/appError';

export const createSectionService = async (
  workspaceId: string,
  projectId: string,
  name: string
) => {
  const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw new NotFoundException('Project not found or does not belong to this workspace');
  }

  const section = new SectionModel({
    name,
    project: projectId,
    workspace: workspaceId,
  });

  await section.save();
  return { section };
};

export const getProjectSectionsService = async (
  workspaceId: string,
  projectId: string
) => {
  // Verify project exists
  const project = await ProjectModel.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // Fetch all sections for this project
  const sections = await SectionModel.find({ project: projectId, workspace: workspaceId }).sort({ createdAt: 1 });
  
  return { sections };
};

export const updateSectionService = async (
  workspaceId: string,
  projectId: string,
  sectionId: string,
  name: string
) => {
  const section = await SectionModel.findOneAndUpdate(
    { _id: sectionId, project: projectId, workspace: workspaceId },
    { name },
    { new: true }
  );

  if (!section) {
    throw new NotFoundException('Section not found');
  }

  return { section };
};

export const deleteSectionService = async (
  workspaceId: string,
  projectId: string,
  sectionId: string
) => {
  const section = await SectionModel.findOneAndDelete({
    _id: sectionId,
    project: projectId,
    workspace: workspaceId,
  });

  if (!section) {
    throw new NotFoundException('Section not found');
  }

  // CASCADE DELETE: Delete all tasks (and their subtasks) that belong to this section
  const tasksToDelete = await TaskModel.find({ section: sectionId });
  const taskIds = tasksToDelete.map(task => task._id);

  if (taskIds.length > 0) {
    // Delete the parent tasks
    await TaskModel.deleteMany({ _id: { $in: taskIds } });
    // Delete all subtasks associated with those parent tasks
    await TaskModel.deleteMany({ parentId: { $in: taskIds } });
  }

  return { section };
};