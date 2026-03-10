import { z } from 'zod';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Loader } from 'lucide-react';
import { useEffect } from 'react'; // Added useEffect
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
import { TaskPriorityEnum, TaskStatusEnum, TaskTypeEnum } from '@/constant';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTaskMutationFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function CreateTaskForm(props: {
  projectId?: string;
  onClose: () => void;
  parentId?: string;
  sectionId?: string; // Prop already exists in your code
}) {
  const { projectId, onClose, parentId, sectionId } = props;

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createTaskMutationFn,
  });

  const { data, isLoading } = useGetProjectsInWorkspaceQuery({
    workspaceId,
    skip: !!projectId,
  });

  const { data: memberData } = useGetWorkspaceMembers(workspaceId);

  const projects = data?.projects || [];
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
          <Avatar className="h-7 w-7">
            <AvatarImage src={member.userId?.profilePicture || ''} alt={name} />
            <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      ),
      value: member.userId._id,
    };
  });

  const formSchema = z.object({
    title: z.string().trim().min(1, { message: 'Title is required' }),
    description: z.string().trim().optional(),
    projectId: z.string().trim().min(1, { message: 'Project is required' }),
    // NEW: Add sectionId to schema
    sectionId: z.string().trim().optional(),
    status: z.enum(Object.values(TaskStatusEnum) as [keyof typeof TaskStatusEnum], {
      required_error: 'Status is required',
    }),
    type: z.enum(Object.values(TaskTypeEnum) as [keyof typeof TaskTypeEnum]).default(TaskTypeEnum.TASK),
    priority: z.enum(Object.values(TaskPriorityEnum) as [keyof typeof TaskPriorityEnum], {
      required_error: 'Priority is required',
    }),
    assignees: z.array(z.string()).default([]),
    dueDate: z.date({ required_error: 'A due date is required.' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: projectId || '',
      sectionId: sectionId || '', // NEW: Default value from props
      type: TaskTypeEnum.TASK,
      assignees: [],
    },
  });

  // NEW: Sync form with sectionId if it changes via props
  useEffect(() => {
    if (sectionId) {
      form.setValue('sectionId', sectionId);
    }
  }, [sectionId, form]);

  const taskStatusList = Object.values(TaskStatusEnum);
  const taskPriorityList = Object.values(TaskPriorityEnum);
  const taskTypeList = Object.values(TaskTypeEnum);

  const statusOptions = transformOptions(taskStatusList);
  const priorityOptions = transformOptions(taskPriorityList);
  const typeOptions = transformOptions(taskTypeList);

  const watchType = form.watch('type');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    const payload = {
      workspaceId,
      projectId: values.projectId,
      data: {
        ...values,
        description: values.description || "",
        dueDate: values.dueDate.toISOString(),
        parentId: parentId || undefined,
        // sectionId is now part of values via formSchema
      },
    };

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project-analytics', values.projectId] });
        queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });

        if (parentId) {
          queryClient.invalidateQueries({
            queryKey: ['singleTask', workspaceId, values.projectId, parentId]
          });
        }

        toast({
          title: 'Success',
          description: parentId ? 'Subtask created successfully' : 'Task created successfully',
          variant: 'success',
        });
        onClose();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="w-full h-auto max-w-full">
      {/* ... (Existing UI Code) ... */}
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1 text-center sm:text-left">
            {parentId ? 'Create Subtask' : 'Create Task'}
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            {parentId
              ? 'Break this task down into smaller, actionable pieces.'
              : 'Organize and manage tasks, resources, and team collaboration'}
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Type */}
            {!parentId && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions?.map((typeOption) => (
                          <SelectItem key={typeOption.value} value={typeOption.value}>
                            {typeOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">Task title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={parentId ? "e.g. Design mobile layout" : "Website Redesign"}
                      className="!h-[48px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                    Task description <span className="text-xs font-extralight ml-2">Optional</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={1} placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden SectionId Field (Optional but keeps it managed) */}
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />

            {/* Project Selection */}
            {!projectId && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading && (
                          <div className="my-2">
                            <Loader className="w-4 h-4 place-self-center flex animate-spin" />
                          </div>
                        )}
                        <div className="w-full max-h-[200px] overflow-y-auto scrollbar">
                          {projectOptions?.map((option) => (
                            <SelectItem
                              className="!capitalize cursor-pointer"
                              value={option.value}
                              key={option.value}
                            >
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

            {/* Assignees */}
            {watchType !== TaskTypeEnum.MILESTONE && (
              <FormField
                control={form.control}
                name="assignees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignees</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={membersOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select assignees"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Due Date & Status Row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions?.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions?.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="w-full mt-4 text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin mr-2" />}
              {parentId ? 'Create Subtask' : 'Create Task'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}