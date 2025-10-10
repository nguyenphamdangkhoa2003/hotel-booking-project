'use client';

import * as z from 'zod';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/logo'; // đổi path nếu khác
import api from '@/lib/axios';

// ---------- Schema ----------
const schema = z.object({
    email: z.string().email('Email không hợp lệ'),
});
type FormValues = z.infer<typeof schema>;

// ---------- Component ----------
export default function ForgotPasswordForm() {
    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
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
        mutationKey: ['auth', 'forgot-password'],
        mutationFn: async (payload: FormValues) => {
            const { data } = await api.post(
                '/auth/forgot-password',
                payload,
                {
                    withCredentials: true,
                }
            );
            return data;
        },
        retry: false,
        onSuccess: () => {
            toast.success(
                'Đã gửi liên kết đặt lại mật khẩu vào email của bạn.'
            );
            reset();
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể gửi email. Thử lại sau.'
            );
        },
    });

    const onSubmit = (values: FormValues) => mutation.mutate(values);
    const disabled = mutation.isPending || isSubmitting;

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
                noValidate>
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div>
                        <Link href="/" aria-label="go home">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">
                            Recover Password
                        </h1>
                        <p className="text-sm">
                            Enter your email to receive a reset link
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="name@example.com"
                                disabled={disabled}
                                {...register('email')}
                                aria-invalid={!!errors.email}
                                aria-describedby={
                                    errors.email ? 'email-error' : undefined
                                }
                            />
                            {errors.email && (
                                <p
                                    id="email-error"
                                    className="text-xs text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={disabled}>
                            {mutation.isPending
                                ? 'Đang gửi...'
                                : 'Send Reset Link'}
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            We&apos;ll send you a link to reset your password.
                        </p>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Remembered your password?
                        <Button
                            asChild
                            variant="link"
                            className="px-2"
                            type="button">
                            <Link href="/login">Log in</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </FormProvider>
    );
}
