'use client';

import * as z from 'zod';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/logo';
import api from '@/lib/axios';

// ---------- Schema ----------
const schema = z
  .object({
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(8, 'Xác nhận mật khẩu tối thiểu 8 ký tự'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  });

type FormValues = z.infer<typeof schema>;

// ---------- Component ----------
export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = methods;

  const mutation = useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: async (payload: FormValues) => {
      if (!token) {
        throw new Error('Thiếu token trong đường dẫn.');
      }

      const body = { token, newPassword: payload.password };
      const { data } = await api.post('/auth/reset-password', body, {
        withCredentials: true,
      });
      return data;
    },
    retry: false,
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.');
      reset();
      router.replace('/login');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);
  const disabled = mutation.isPending || isSubmitting;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
        noValidate
      >
        <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
          <div>
            <Link href="/" aria-label="go home">
              <LogoIcon />
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">Reset Password</h1>
            <p className="text-sm">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-sm">
                  New Password
                </Label>
              </div>
              <Input
                id="pwd"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="input sz-md variant-mixed"
                disabled={disabled}
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="block text-sm">
                Confirm New Password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={disabled}
                {...register('confirmPassword')}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Hiển thị token (ẩn) để tránh mất khi submit; không cần nếu backend chỉ đọc từ query server-side */}
            <input type="hidden" name="token" value={token} />

            <Button className="w-full" type="submit" disabled={disabled || !token}>
              {mutation.isPending ? 'Đang xử lý...' : 'Reset Password'}
            </Button>

            {!token && (
              <p className="text-xs text-red-500">
                Không tìm thấy token trong URL. Vui lòng kiểm tra lại liên kết đặt lại mật khẩu.
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Bạn gặp vấn đề? Hãy yêu cầu liên kết mới tại trang{' '}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Forgot Password
              </Link>.
            </p>
          </div>
        </div>

        <div className="p-3">
          <p className="text-accent-foreground text-center text-sm">
            Nhớ mật khẩu?
            <Button asChild variant="link" className="px-2" type="button">
              <Link href="/login">Log in</Link>
            </Button>
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
