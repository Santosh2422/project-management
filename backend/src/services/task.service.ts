import { TaskPriorityEnum, TaskStatusEnum } from '../enums/task.enum'; // Importing enums for task priority and status
import MemberModel from '../models/member.model'; // Importing the Member model
import ProjectModel from '../models/project.model'; // Importing the Project model
import TaskModel from '../models/task.model'; // Importing the Task model
import WorkspaceModel from '../models/workspace.model'; // Importing the Workspace model
import { BadRequestException, NotFoundException } from '../utils/appError'; // Importing custom error classes

// Service to create a new task
export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignees?: string[];
    dueDate?: string;
    parentId?: string; // <-- NEW: Accept optional parentId
  }
) => {
  const { title, description, priority, status, assignees, dueDate, parentId } = body; 
  
  const project = await ProjectModel.findById(projectId);
  if (!project || project.workspace.toString() !== workspaceId) {
    throw new NotFoundException('Project not found');
  }

  // --- NEW: SUBTASK NESTING VALIDATION ---
  if (parentId) {
    const parentTask = await TaskModel.findById(parentId);
    
    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    // Ensure the parent task belongs to the same project/workspace
    if (parentTask.project.toString() !== projectId) {
      throw new BadRequestException('Parent task must belong to the same project');
    }

    // ENFORCE THE RULE: Prevent subtasks of subtasks
    if (parentTask.parentId) {
      throw new BadRequestException('Nesting limit reached: You cannot add a subtask to a subtask.');
    }
  }
  // ---------------------------------------

  if (assignees && assignees.length > 0) {
    const memberCount = await MemberModel.countDocuments({
      userId: { $in: assignees },
      workspaceId: workspaceId,
    });

    if (memberCount !== assignees.length) {
      throw new NotFoundException('Some assignees are not members of the workspace');
    }
  }

  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignees: assignees || [],
    dueDate,
    workspace: workspaceId,
    project: projectId,
    createdBy: userId,
    parentId: parentId || null, // <-- NEW: Save the parentId
  });

  await task.save();

  return { task };
};

// Service to update an existing task
export const updateTaskService = async (
  workspaceId: string, // Workspace ID
  projectId: string, // Project ID
  taskId: string, // Task ID
  body: {
    // Task update details
    title?: string; // Optional updated title
    description?: string; // Optional updated description
    priority?: string; // Optional updated priority
    status?: string; // Optional updated status
    assignees?: string[]; // Optional updated assigned users
    dueDate?: string; // Optional updated due date
  }
) => {
  const { title, description, priority, status, assignees, dueDate } = body; // Destructuring update details

  const project = await ProjectModel.findById(projectId); // Fetching the project by ID
  if (!project || project.workspace.toString() !== workspaceId) {
    // Validating project existence and workspace association
    throw new NotFoundException('Project not found or does not belong to this workspace'); // Throw error if invalid
  }

  const task = await TaskModel.findById(taskId); // Fetching the task by ID
  if (!task || task.project.toString() !== projectId) {
    // Validating task existence and project association
    throw new NotFoundException('Task not found or task is not part of this project'); // Throw error if invalid
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId, // Task ID to update
    {
      title, // Updating title
      description, // Updating description
      priority, // Updating priority
      status, // Updating status
      assignees, // Updating assigned users
      dueDate, // Updating due date
    },
    { new: true } // Returning the updated document
  );

  if (!updatedTask) {
    // If the update fails
    throw new BadRequestException('Failed to update task'); // Throw error
  }

  return { task: updatedTask }; // Returning the updated task
};

// Service to fetch all tasks with filters and pagination
export const getAllTasksService = async (
  workspaceId: string, // Workspace ID
  filters: {
    // Filters for querying tasks
    projectId?: string; // Optional project ID filter
    status?: string[]; // Optional status filter
    priority?: string[]; // Optional priority filter
    assignees?: string[]; // Optional assigned users filter
    dueDate?: string; // Optional due date filter
    keyword?: string; // Optional keyword filter
  },
  pagination: {
    // Pagination details
    pageSize: number; // Number of tasks per page
    pageNumber: number; // Current page number
  }
) => {
  const query: Record<string, any> = { workspace: workspaceId, parentId: null }; // Base query with workspace ID
  const { projectId, status, priority, assignees, dueDate, keyword } = filters; // Destructuring filters
  const { pageSize, pageNumber } = pagination; // Destructuring pagination details

  if (projectId) {
    // If project ID filter is provided
    query.project = projectId; // Add project ID to query
  }

  if (status && status.length > 0) {
    // If status filter is provided
    query.status = { $in: status }; // Add status filter to query
  }

  if (priority && priority.length > 0) {
    // If priority filter is provided
    query.priority = { $in: priority }; // Add priority filter to query
  }

  if (assignees && assignees.length > 0) {
    // If assigned user filter is provided (tasks containing at least one of these assignees)
    query.assignees = { $in: assignees }; // Add assignees filter to query
  }

  if (keyword) {
    // If keyword filter is provided
    query.title = { $regex: keyword, $options: 'i' }; // Add keyword filter to query (case-insensitive)
  }

  if (dueDate) {
    // If due date filter is provided
    const [fromDateStr, toDateStr] = dueDate.split(',');
    const dateQuery: Record<string, any> = {};

    if (fromDateStr) {
      dateQuery['$gte'] = new Date(fromDateStr);
    }
    if (toDateStr) {
      const toDate = new Date(toDateStr);
      // toDate is interpreted as midnight GMT. Set it to the end of the day.
      toDate.setUTCHours(23, 59, 59, 999);
      dateQuery['$lte'] = toDate;
    }

    if (Object.keys(dateQuery).length > 0) {
      query.dueDate = dateQuery;
    }
  }

  const skip = (pageNumber - 1) * pageSize; // Calculate the number of documents to skip
  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query) // Fetch tasks matching the query
      .skip(skip) // Skip documents for pagination
      .limit(pageSize) // Limit the number of documents per page
      .sort({ createdAt: -1 }) // Sort tasks by creation date in descending order
      .populate('assignees', '_id name profilePicture -password') // Populate assigned user details
      .populate('project', '_id emoji name'), // Populate project details
    TaskModel.countDocuments(query), // Count total tasks matching the query
  ]);
  const totalPages = Math.ceil(totalCount / pageSize); // Calculate total pages
  return {
    tasks, // Return fetched tasks
    paginaion: {
      // Return pagination details
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

// Service to fetch a task by its ID
export const getTaskByIdService = async (
  workspaceId: string, 
  projectId: string, 
  taskId: string 
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId) {
    throw new NotFoundException('Project not found'); 
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    project: projectId, 
    workspace: workspaceId, 
  }).populate('assignees', '_id name profilePicture -password'); 

  if (!task) {
    throw new NotFoundException('Task not found'); 
  }

  // --- NEW: FETCH SUBTASKS ---
  const subtasks = await TaskModel.find({
    parentId: taskId, // Find all tasks that have THIS task as a parent
    workspace: workspaceId
  })
  .select('_id title status priority dueDate assignees') // Only fetch what we need for the list
  .populate('assignees', '_id name profilePicture');

  return {
    // Use .toObject() to easily inject the subtasks array into the response
    task: { ...task.toObject(), subtasks }, 
  };
};

// Service to delete a task by its ID
export const deleteTaskByIdService = async (workspaceId: string, taskId: string) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId, 
    workspace: workspaceId, 
  });
  
  if (!task) {
    throw new NotFoundException('Task not found or does not belong to this workspace'); 
  }

  // --- NEW: CASCADE DELETE SUBTASKS ---
  // Delete all tasks where the parentId matches the deleted task
  await TaskModel.deleteMany({
    parentId: taskId,
    workspace: workspaceId
  });

  return { task }; 
};


// Inside task.service.ts
export const getTasksService = async (workspaceId: string, filters: any) => {
  const query: any = { workspaceId };

  // Add date filtering logic
  if (filters.startDate && filters.endDate) {
    query.dueDate = {
      $gte: new Date(filters.startDate), // Greater than or equal to
      $lte: new Date(filters.endDate),   // Less than or equal to
    };
  }

  return await TaskModel.find(query).sort({ dueDate: 1 });
};

