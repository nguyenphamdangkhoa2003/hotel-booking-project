'use client';

import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/logo'; // đổi nếu logo khác
import api from '@/lib/axios';

// --------- Schema ---------
const schema = z
    .object({
        fullName: z.string().min(1, 'Vui lòng nhập tên'),
        email: z.string().email('Email không hợp lệ'),
        password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
        confirmPassword: z
            .string()
            .min(8, 'Xác nhận mật khẩu tối thiểu 8 ký tự'),
    })
    .refine((v) => v.password === v.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Mật khẩu xác nhận không khớp',
    });

type FormValues = z.infer<typeof schema>;

// --------- Component ---------
export default function RegisterForm() {
    const router = useRouter();

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
    });

    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting },
    } = methods;

    const registerMutation = useMutation({
        mutationKey: ['auth', 'register'],
        mutationFn: async (payload: FormValues) => {
            const body = {
                fullName: payload.fullName,
                email: payload.email,
                password: payload.password,
            };
            const { data } = await api.post('/auth/register', body, {
                withCredentials: true,
            });
            return data;
        },
        retry: false,
        onSuccess: () => {
            toast.success('Tạo tài khoản thành công!');
            // Điều hướng sau khi đăng ký: có thể về login hoặc dashboard
            router.replace('/login');
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Đăng ký không thành công'
            );
        },
    });

    const onSubmit = (values: FormValues) => registerMutation.mutate(values);
    const disabled = registerMutation.isPending || isSubmitting;

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
                noValidate>
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="mx-auto block w-fit">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">
                            Create a Tailark Account
                        </h1>
                        <p className="text-sm">
                            Welcome! Create an account to get started
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="block text-sm">
                                Name
                            </Label>
                            <Input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                placeholder="Nguyen"
                                disabled={disabled}
                                {...register('fullName')}
                                aria-invalid={!!errors.fullName}
                                aria-describedby={
                                    errors.fullName
                                        ? 'firstname-error'
                                        : undefined
                                }
                            />
                            {errors.fullName && (
                                <p
                                    id="fullname-error"
                                    className="text-xs text-red-500">
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="you@example.com"
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

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pwd" className="text-sm">
                                    Password
                                </Label>
                                <Button
                                    asChild
                                    variant="link"
                                    size="sm"
                                    type="button">
                                    <Link
                                        href="/forgot-password"
                                        className="link intent-info variant-ghost text-sm">
                                        Forgot your Password ?
                                    </Link>
                                </Button>
                            </div>

                            <Input
                                id="pwd"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="input sz-md variant-mixed"
                                disabled={disabled}
                                {...register('password')}
                                aria-invalid={!!errors.password}
                                aria-describedby={
                                    errors.password
                                        ? 'password-error'
                                        : undefined
                                }
                            />
                            {errors.password && (
                                <p
                                    id="password-error"
                                    className="text-xs text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm" className="block text-sm">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirm"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                disabled={disabled}
                                {...register('confirmPassword')}
                                aria-invalid={!!errors.confirmPassword}
                                aria-describedby={
                                    errors.confirmPassword
                                        ? 'confirm-error'
                                        : undefined
                                }
                            />
                            {errors.confirmPassword && (
                                <p
                                    id="confirm-error"
                                    className="text-xs text-red-500">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={disabled}>
                            {registerMutation.isPending
                                ? 'Đang xử lý...'
                                : 'Create account'}
                        </Button>
                    </div>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <hr className="border-dashed" />
                        <span className="text-muted-foreground text-xs">
                            Or continue With
                        </span>
                        <hr className="border-dashed" />
                    </div>

                    <div className="flex">
                        <Button
                            className="flex-1 cursor-pointer"
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            aria-label="Continue with Google">
                            <a
                                className="inline-flex items-center justify-center gap-2"
                                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                                aria-label="Sign in with Google"
                                target="_self">
                                {/* Google icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="0.98em"
                                    height="1em"
                                    viewBox="0 0 256 262"
                                    aria-hidden="true">
                                    <path
                                        fill="#4285f4"
                                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                    />
                                    <path
                                        fill="#34a853"
                                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                    />
                                    <path
                                        fill="#fbbc05"
                                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                                    />
                                    <path
                                        fill="#eb4335"
                                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                    />
                                </svg>
                                <span>Google</span>
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2"
                            type="button">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </FormProvider>
    );
}
