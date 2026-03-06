import { z } from 'zod';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Loader, AlignLeft, Flag, Folder, Users, ListTree, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '../../ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { getAvatarColor, getAvatarFallbackText, transformOptions } from '@/lib/helper';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { TaskPriorityEnum, TaskStatusEnum } from '@/constant';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { editTaskMutationFn, getTaskByIdQueryFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

// Dialog, Create Task Form & Checkbox Imports
import { Dialog, DialogContent } from '@/components/ui/dialog'; 
import { Checkbox } from '@/components/ui/checkbox'; // <-- NEW: Imported Checkbox
import CreateTaskForm from './create-task-form';

export default function EditTaskForm(props: {
  projectId: string;
  taskId: string;
  fromAllTask: boolean;
  onClose: () => void;
}) {
  const { projectId, onClose, taskId, fromAllTask } = props;

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false);

  const { data: taskData, isPending } = useQuery({
    queryKey: ['singleTask', workspaceId, projectId, taskId],
    queryFn: () => getTaskByIdQueryFn({ workspaceId, projectId, taskId }),
    staleTime: Infinity,
    enabled: !!projectId && !!taskId,
    placeholderData: keepPreviousData,
  });

  // Mutation for the MAIN task form
  const { mutate, isPending: Updating } = useMutation({
    mutationFn: editTaskMutationFn,
  });

  // --- NEW: Separate mutation just for toggling subtasks ---
  const { mutate: updateSubtaskStatus } = useMutation({
    mutationFn: editTaskMutationFn,
    onSuccess: () => {
      // Refresh the parent task so the subtask list updates instantly
      queryClient.invalidateQueries({ queryKey: ['singleTask', workspaceId, projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // --- NEW: Handler for clicking the subtask checkbox ---
  const handleToggleSubtask = (subtask: any, checked: boolean) => {
    const newStatus = checked ? TaskStatusEnum.DONE : TaskStatusEnum.TODO;
    
    updateSubtaskStatus({
      workspaceId,
      projectId: subtask.project || projectId,
      taskId: subtask._id,
      data: {
        title: subtask.title,
        status: newStatus,
        priority: subtask.priority,
        dueDate: subtask.dueDate,
        assignees: subtask.assignees?.map((a: any) => a._id || a) || [],
        description: subtask.description || '',
      }
    });
  };

  const { data: projectData, isLoading } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    skip: !!projectId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = projectData?.projects || [];
  const members = memberData?.members || [];

  const projectOptions = projects?.map((project) => ({
    label: (
      <div className="flex items-center gap-1">
        <span>{project.emoji}</span>
        <span>{project.name}</span>
      </div>
    ),
    value: project._id,
  }));

  const membersOptions = members?.map((member) => {
    const name = member.userId?.name || 'Unknown';
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={member.userId?.profilePicture || ''} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id.toString(),
    };
  });

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: 'Title is required' }),
    description: z.string().trim().optional(),
    projectId: z.string().trim().min(1, { message: 'Project is required' }),
    status: z.enum(Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum], {
      required_error: 'Status is required',
    }),
    priority: z.enum(Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum], {
      required_error: 'Priority is required',
    }),
    assignees: z.array(z.string()).min(1, { message: 'Select at least one assignee' }),
    dueDate: z.date({ required_error: 'A due date is required.' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: projectId ? projectId : '',
      assignees: [],
    },
  });

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);

  useEffect(() => {
    if (taskData) {
      form.setValue('title', taskData.task.title);
      form.setValue('description', taskData.task?.description || '');
      form.setValue('projectId', taskData.task.project || projectId);
      form.setValue('status', taskData.task.status);
      form.setValue('priority', taskData.task.priority);
      form.setValue(
        'assignees',
        taskData.task.assignees ? taskData.task.assignees.map((a: any) => a._id || a) : []
      );
      form.setValue('dueDate', new Date(taskData.task.dueDate));
    }
  }, [form, JSON.stringify(taskData)]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    const payload = {
      workspaceId,
      projectId: projectId,
      taskId,
      data: {
        ...values,
        description: values.description || '',
        dueDate: values.dueDate.toISOString(),
      },
    };

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
        queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
        toast({ title: 'Success', description: 'Task updated successfully', variant: 'success' });
        onClose();
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  const ghostInputClass = "h-8 px-2 -ml-2 w-fit border-none shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 transition-colors cursor-pointer text-foreground";
  const propertyIconClass = "w-[130px] flex items-center gap-2 text-sm text-muted-foreground font-normal shrink-0";

  // --- SUBTASK LOGIC ---
  const isSubtask = !!taskData?.task?.parentId;
  const subtasks = taskData?.task?.subtasks || [];

  return (
    <div className="w-full">
      {isPending ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>

              {/* --- 1. HEADER & TITLE --- */}
              <div className="flex items-start justify-between gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input
                          placeholder="Task Title"
                          className="text-3xl md:text-4xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto -ml-[1px] placeholder:text-muted-foreground/40 bg-transparent"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className="h-9 shrink-0 text-white font-medium"
                  type="submit"
                  disabled={Updating}
                >
                  {Updating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>

              <div className="w-full h-[1px] bg-border/50 my-1" />

              {/* --- 2. PROPERTIES --- */}
              <div className="grid grid-cols-[130px_1fr] items-center gap-y-2">

                {/* Status */}
                <div className={propertyIconClass}>
                  <CheckCircle2 className="w-4 h-4" /> Status
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex flex-col">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(ghostInputClass, "capitalize")}>
                            <SelectValue placeholder="Empty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions?.map((status) => (
                            <SelectItem className="capitalize" key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs ml-2" />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <div className={propertyIconClass}>
                  <Flag className="w-4 h-4" /> Priority
                </div>
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex flex-col">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(ghostInputClass, "capitalize")}>
                            <SelectValue placeholder="Empty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions?.map((priority) => (
                            <SelectItem className="capitalize" key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs ml-2" />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <div className={propertyIconClass}>
                  <CalendarIcon className="w-4 h-4" /> Due Date
                </div>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(ghostInputClass, !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Empty</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                              date > new Date('2100-12-31')
                            }
                            initialFocus
                            defaultMonth={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs ml-2" />
                    </FormItem>
                  )}
                />

                {/* Assignees */}
                <div className={propertyIconClass}>
                  <Users className="w-4 h-4" /> Assignees
                </div>
                <FormField
                  control={form.control}
                  name="assignees"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex flex-col">
                      <FormControl>
                        <div className="w-full -ml-2">
                          <MultiSelect
                            options={membersOptions}
                            selected={field.value}
                            onChange={field.onChange}
                            placeholder="Empty"
                            className="border-none shadow-none bg-transparent min-h-8 py-0 focus:ring-0 hover:bg-muted/50 transition-colors w-full"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs ml-2" />
                    </FormItem>
                  )}
                />

                {/* Project (If applicable) */}
                {fromAllTask && (
                  <>
                    <div className={propertyIconClass}>
                      <Folder className="w-4 h-4" /> Project
                    </div>
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem className="space-y-0 flex flex-col">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className={cn(ghostInputClass, "capitalize w-full")}>
                                <SelectValue placeholder="Empty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoading && (
                                <div className="my-2 flex justify-center">
                                  <Loader className="w-4 h-4 animate-spin" />
                                </div>
                              )}
                              <div className="max-h-[200px] overflow-y-auto scrollbar">
                                {projectOptions?.map((option) => (
                                  <SelectItem className="capitalize cursor-pointer" value={option.value} key={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs ml-2" />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <div className="w-full h-[1px] bg-border/50 my-1" />

              {/* --- 3. DESCRIPTION --- */}
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2 w-full">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
                        <AlignLeft className="w-4 h-4" /> Description
                      </div>
                      <FormControl>
                        <Textarea
                          className="w-full min-h-[100px] border-none shadow-none focus-visible:ring-0 resize-y p-0 text-base bg-transparent placeholder:text-muted-foreground/40 leading-relaxed"
                          placeholder="Add more details to this task..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- 4. SUBTASKS SECTION --- */}
              {!isSubtask && (
                <div className="w-full mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
                      <ListTree className="w-4 h-4" /> Subtasks
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={() => setIsCreateSubtaskOpen(true)}
                    >
                      + Add Subtask
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {subtasks.length > 0 ? (
                      subtasks.map((subtask: any) => {
                        const isDone = subtask.status === TaskStatusEnum.DONE;
                        
                        return (
                          <div 
                            key={subtask._id} 
                            className="flex items-center justify-between p-3 border rounded-md bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                               navigate(`/workspace/${workspaceId}/project/${subtask.project || projectId}/task/${subtask._id}`);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* --- THE NEW CHECKBOX --- */}
                              {/* We wrap it in a div that stops propagation so clicking the checkbox doesn't navigate away */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={isDone}
                                  onCheckedChange={(checked) => handleToggleSubtask(subtask, !!checked)}
                                />
                              </div>
                              <span className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
                                {subtask.title}
                              </span>
                            </div>
                            
                            {/* Hide the status text if it is DONE since the checkbox handles it visually */}
                            {!isDone && (
                              <span className="text-xs text-muted-foreground uppercase font-medium">
                                {subtask.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No subtasks yet.</p>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>

          {/* Dialog rendered OUTSIDE the form to prevent nesting errors */}
          <Dialog open={isCreateSubtaskOpen} onOpenChange={setIsCreateSubtaskOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-none bg-transparent">
              <div className="bg-background p-6 rounded-lg shadow-lg border">
                 <CreateTaskForm 
                    projectId={projectId} 
                    parentId={taskId} 
                    onClose={() => setIsCreateSubtaskOpen(false)} 
                 />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}