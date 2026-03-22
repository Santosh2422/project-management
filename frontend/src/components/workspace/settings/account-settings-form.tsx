import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/auth-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserMutationFn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useEffect } from 'react';

// ─── Profile (name) schema ────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }),
});

// ─── Password schema ──────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─────────────────────────────────────────────────────────────────────────────

// ── Password input helper (must be defined at module level, NOT inside
//    AccountSettingsForm, to prevent React from remounting it on every render) ─
function PasswordInput({
  placeholder,
  show,
  toggleShow,
  field,
}: {
  placeholder: string;
  show: boolean;
  toggleShow: () => void;
  field: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="!h-[48px] pr-10 disabled:opacity-90 disabled:pointer-events-none"
        {...field}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={toggleShow}
      >
        {show ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

export default function AccountSettingsForm() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending } = useMutation({ mutationFn: updateUserMutationFn });

  // ── Show/hide password state ──────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (user?.name) profileForm.setValue('name', user.name);
  }, [user, profileForm]);

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    if (isPending) return;
    updateUser(
      { name: values.name },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast({ title: 'Profile updated', description: 'Your name has been saved.' });
        },
        onError: (error) => {
          const err = error as Error & { response?: { data?: { message?: string } } };
          toast({
            title: 'Error',
            description: err.response?.data?.message || err.message || 'Something went wrong',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // ── Password form ─────────────────────────────────────────────────────
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    if (isPending) return;
    updateUser(
      { currentPassword: values.currentPassword, password: values.newPassword },
      {
        onSuccess: () => {
          passwordForm.reset();
          toast({ title: 'Password changed', description: 'Your password has been updated.' });
        },
        onError: (error) => {
          const err = error as Error & { response?: { data?: { message?: string } } };
          toast({
            title: 'Error',
            description: err.response?.data?.message || err.message || 'Something went wrong',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Profile Information ── */}
      <div className="w-full h-auto max-w-full">
        <div className="h-full">
          <div className="mb-5 border-b">
            <h1 className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5 text-center sm:text-left">
              Profile Information
            </h1>
            <p className="text-sm text-muted-foreground mb-3">Update your display name.</p>
          </div>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <div className="mb-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="!h-[48px] disabled:opacity-90 disabled:pointer-events-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mb-4">
                <FormItem>
                  <FormLabel className="dark:text-[#f1f7feb5] text-sm">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      value={user?.email || ''}
                      className="!h-[48px] opacity-60 pointer-events-none"
                      disabled
                      readOnly
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                </FormItem>
              </div>
              <Button
                className="flex place-self-end h-[40px] text-white font-semibold"
                disabled={isPending}
                type="submit"
              >
                {isPending && <Loader className="animate-spin mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <Separator />

      {/* ── Change Password ── */}
      <div className="w-full h-auto max-w-full">
        <div className="h-full">
          <div className="mb-5 border-b">
            <h1 className="text-[17px] tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5 text-center sm:text-left">
              Change Password
            </h1>
            <p className="text-sm text-muted-foreground mb-3">
              Choose a strong password with at least 8 characters.
            </p>
          </div>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <div className="mb-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                        Current Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter current password"
                          show={showCurrent}
                          toggleShow={() => setShowCurrent((p) => !p)}
                          field={field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mb-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Min. 8 characters"
                          show={showNew}
                          toggleShow={() => setShowNew((p) => !p)}
                          field={field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mb-4">
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Re-enter new password"
                          show={showConfirm}
                          toggleShow={() => setShowConfirm((p) => !p)}
                          field={field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                className="flex place-self-end h-[40px] text-white font-semibold"
                disabled={isPending}
                type="submit"
              >
                {isPending && <Loader className="animate-spin mr-2 h-4 w-4" />}
                Update Password
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
