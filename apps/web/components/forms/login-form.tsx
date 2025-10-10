'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import api from '@/lib/axios';
import { tokenStore } from '@/lib/auth-tokens';
// Nếu có logo riêng, import vào đây:

const schema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
        mode: 'onSubmit',
    });

    const loginMutation = useMutation({
        mutationKey: ['auth', 'login'],
        mutationFn: async (payload: FormValues) => {
            const { data } = await api.post('/auth/login', payload);
            if (data?.accessToken) tokenStore.setAccess(data.accessToken);
            if (data?.refreshToken) tokenStore.setRefresh(data.refreshToken);
            return data;
        },
        retry: false,
        onSuccess: () => {
            toast.success('Đăng nhập thành công!');
            // router.push('/dashboard')
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || 'Sai thông tin đăng nhập'
            );
        },
    });

    const onSubmit = (values: FormValues) => loginMutation.mutate(values);
    const disabled = loginMutation.isPending;

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
            <div className="p-8 pb-6">
                <div>
                    <Link href="/" aria-label="go home">
                        <Logo />
                    </Link>
                    <h1 className="mb-1 mt-4 text-xl font-semibold">
                        Sign In to Tailark
                    </h1>
                    <p className="text-sm">Welcome back! Sign in to continue</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            (window.location.href = '/api/auth/google')
                        }
                        disabled={disabled}>
                        {/* Google icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="0.98em"
                            height="1em"
                            viewBox="0 0 256 262">
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
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            (window.location.href = '/api/auth/microsoft')
                        }
                        disabled={disabled}>
                        {/* Microsoft icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 256 256">
                            <path
                                fill="#f1511b"
                                d="M121.666 121.666H0V0h121.666z"
                            />
                            <path
                                fill="#80cc28"
                                d="M256 121.666H134.335V0H256z"
                            />
                            <path
                                fill="#00adef"
                                d="M121.663 256.002H0V134.336h121.663z"
                            />
                            <path
                                fill="#fbbc09"
                                d="M256 256.002H134.335V134.336H256z"
                            />
                        </svg>
                        <span>Microsoft</span>
                    </Button>
                </div>

                <hr className="my-4 border-dashed" />

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="block text-sm">
                            Username
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            disabled={disabled}
                            {...form.register('email')}
                            aria-invalid={!!form.formState.errors.email}
                            aria-describedby="email-error"
                        />
                        {form.formState.errors.email && (
                            <p
                                id="email-error"
                                className="text-xs text-red-500">
                                {form.formState.errors.email.message}
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
                            className="input sz-md variant-mixed"
                            placeholder="••••••••"
                            disabled={disabled}
                            {...form.register('password')}
                            aria-invalid={!!form.formState.errors.password}
                            aria-describedby="password-error"
                        />
                        {form.formState.errors.password && (
                            <p
                                id="password-error"
                                className="text-xs text-red-500">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        className="w-full"
                        type="submit"
                        disabled={disabled}>
                        {loginMutation.isPending ? 'Đang xử lý...' : 'Sign In'}
                    </Button>
                </div>
            </div>

            <div className="bg-muted rounded-(--radius) border p-3">
                <p className="text-accent-foreground text-center text-sm">
                    Don&apos;t have an account ?
                    <Button
                        asChild
                        variant="link"
                        className="px-2"
                        type="button">
                        <Link href="/register">Create account</Link>
                    </Button>
                </p>
            </div>
        </form>
    );
}
