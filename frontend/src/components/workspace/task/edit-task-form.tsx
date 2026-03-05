import { z } from 'zod';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// Added a few more icons to make it look like Notion/Asana properties
import { CalendarIcon, Loader, AlignLeft, CheckCircle2, Flag, Folder, Users } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { useEffect } from 'react';

export default function EditTaskForm(props: {
  projectId: string;
  taskId: string;
  fromAllTask: boolean;
  onClose: () => void;
}) {
  const { projectId, onClose, taskId, fromAllTask } = props;

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  // --- LOGIC REMAINS EXACTLY THE SAME ---
  const { data: taskData, isPending } = useQuery({
    queryKey: ['singleTask', workspaceId, projectId, taskId],
    queryFn: () => getTaskByIdQueryFn({ workspaceId, projectId, taskId }),
    staleTime: Infinity,
    enabled: !!projectId && !!taskId,
    placeholderData: keepPreviousData,
  });

  const { mutate, isPending: Updating } = useMutation({
    mutationFn: editTaskMutationFn,
  });

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
    const name = member.userId?.name || 'Unknow';
    const initials = getAvatarFallbackText(name);
    const avatarColor = getAvatarColor(name);
    return {
      label: (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
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
    description: z.string().trim(),
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

  // Helper class for Notion-style inline inputs (borderless until hovered)
  const inlineInputClass = "border-transparent hover:border-border shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 transition-colors cursor-pointer h-8";
  
  // Helper class for the fixed-width property labels
  const propertyLabelClass = "w-32 flex items-center gap-2 text-sm text-muted-foreground font-normal whitespace-nowrap";

  return (
    <div className="w-full max-w-full">
      {isPending ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form className="flex flex-col gap-8 pb-10" onSubmit={form.handleSubmit(onSubmit)}>
            
            {/* --- 1. THE TITLE (Massive and Borderless) --- */}
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Task Title"
                        className="text-3xl md:text-4xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- 2. PROPERTIES GRID (Notion/Asana style metadata) --- */}
            <div className="flex flex-col gap-3 py-4 border-y">
              
              {/* Status Row */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0">
                    <FormLabel className={propertyLabelClass}>
                      <CheckCircle2 className="w-4 h-4" /> Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn("w-auto min-w-[140px]", inlineInputClass)}>
                          <SelectValue placeholder="Select status" className="capitalize" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority Row */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0">
                    <FormLabel className={propertyLabelClass}>
                      <Flag className="w-4 h-4" /> Priority
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn("w-auto min-w-[140px]", inlineInputClass)}>
                          <SelectValue placeholder="Select priority" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assignees Row */}
              <FormField
                control={form.control}
                name="assignees"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0">
                    <FormLabel className={propertyLabelClass}>
                      <Users className="w-4 h-4" /> Assignees
                    </FormLabel>
                    <FormControl>
                      <div className="flex-1 max-w-[300px]">
                        <MultiSelect
                          options={membersOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Empty"
                          className={inlineInputClass}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date Row */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0">
                    <FormLabel className={propertyLabelClass}>
                      <CalendarIcon className="w-4 h-4" /> Due Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-auto min-w-[140px] justify-start text-left font-normal",
                              inlineInputClass,
                              !field.value && "text-muted-foreground"
                            )}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Row (Only if fromAllTask) */}
              {fromAllTask && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-y-0">
                      <FormLabel className={propertyLabelClass}>
                        <Folder className="w-4 h-4" /> Project
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn("w-auto min-w-[140px]", inlineInputClass)}>
                            <SelectValue placeholder="Select a project" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* --- 3. DESCRIPTION (Large open canvas) --- */}
            <div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-4">
                      <AlignLeft className="w-4 h-4" /> Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[250px] border-none shadow-none focus-visible:ring-0 resize-y px-0 text-base"
                        placeholder="Add more details to this task..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- 4. FOOTER / SUBMIT BUTTON --- */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                className="h-[40px] text-white font-semibold min-w-[120px]"
                type="submit"
                disabled={Updating}
              >
                {Updating && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>

          </form>
        </Form>
      )}
    </div>
  );
}