'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { updateProfile } from '@/lib/users';
import { profileSchema, type ProfileFormValues } from '@/schemas/profile.schema';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? '',
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      password: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setError(null);
    setMessage(null);

    const payload: Record<string, string> = {};
    if (values.username) payload.username = values.username;
    if (values.fullName) payload.fullName = values.fullName;
    if (values.email) payload.email = values.email;
    if (values.password) payload.password = values.password;

    if (Object.keys(payload).length === 0) {
      setError('No changes to save');
      return;
    }

    try {
      const updated = await updateProfile(payload);
      updateUser(updated);

      if (values.password) {
        setMessage('Password updated. Please sign in again.');
        clearAuth();
        router.replace('/login');
        return;
      }

      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Update your account profile</p>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <Avatar fullName={user.fullName} className="h-14 w-14 text-base" />
          <div>
            <p className="font-medium">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...register('username')} />
          {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input id="password" type="password" placeholder="Leave blank to keep current" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
