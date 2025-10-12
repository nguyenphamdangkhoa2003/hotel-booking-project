'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Loader from '@/components/kokonutui/loader';
import ResultCard from '@/components/result-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';
import { toast } from 'sonner';

type VerifyResponse = {
    ok?: boolean; // có thể undefined nếu BE không trả
    message?: string;
};

type ResendResponse = {
    ok?: boolean;
    message?: string;
};

async function verifyEmail(token: string): Promise<VerifyResponse> {
    const res = await api.post('/auth/verify', { token });
    // Chuẩn hoá để luôn có ok/message
    const ok =
        typeof res.data?.ok === 'boolean' ? res.data.ok : res.status < 400;
    const message =
        res.data?.message ??
        (ok ? 'Email của bạn đã được xác thực.' : 'Xác thực không thành công.');
    return { ok, message };
}

async function resendVerifyEmail(email: string): Promise<ResendResponse> {
    const res = await api.post('/auth/resend-verification', { email });
    const ok =
        typeof res.data?.ok === 'boolean' ? res.data.ok : res.status < 400;
    const message =
        res.data?.message ??
        (ok
            ? 'Đã gửi lại email xác thực.'
            : 'Gửi lại email xác thực thất bại.');
    return { ok, message };
}

export default function Page() {
    const search = useSearchParams();
    const router = useRouter();
    const token = search.get('token') ?? '';
    const emailFromQuery = search.get('email') ?? '';

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['verify-email', token],
        queryFn: () => verifyEmail(token),
        enabled: !!token,
        retry: false,
    });

    // (tuỳ chọn) hiện toast khi verify lỗi
    React.useEffect(() => {
        if (!token) return;
        if (isError) {
            const msg =
                (error as any)?.response?.data?.message ||
                'Xác thực thất bại. Vui lòng gửi lại email.';
            toast.error(msg);
        } else if (!isPending && data && data.ok === false) {
            toast.error(data.message || 'Xác thực thất bại. Vui lòng thử lại.');
        }
    }, [token, isError, isPending, data, error]);

    // ----- Resend form state -----
    const [email, setEmail] = React.useState(emailFromQuery);

    const resendMutation = useMutation({
        mutationKey: ['auth', 'resend-verify'],
        mutationFn: async () => resendVerifyEmail(email.trim()),
        onSuccess: (res) => {
            toast.success(res.message || 'Đã gửi lại email xác thực.');
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    'Không thể gửi lại email xác thực. Vui lòng thử lại sau.'
            );
        },
    });

    // Điều kiện hiển thị resend: token thiếu HOẶC verify lỗi/không ok/không có data
    const showResendForm =
        !token || isError || (data ? data.ok === false : true);

    return (
        <section className="flex min-h-screen items-center justify-center px-6 bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="w-full max-w-lg space-y-6">
                {/* 1) THIẾU TOKEN */}
                {!token && (
                    <ResultCard
                        status="error"
                        title="Thiếu token"
                        message="Đường dẫn không có tham số ?token=... Vui lòng kiểm tra lại email xác thực."
                    />
                )}

                {/* 2) ĐANG VERIFY */}
                {token && isPending && <Loader />}

                {/* 3) VERIFY THÀNH CÔNG */}
                {token && !isPending && !isError && data?.ok === true && (
                    <div className="space-y-4">
                        <ResultCard
                            status="success"
                            title="Xác thực thành công"
                            message={
                                data?.message ??
                                'Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.'
                            }
                        />
                        <Button
                            className="w-full"
                            onClick={() => router.push('/login')}>
                            Đăng nhập
                        </Button>
                    </div>
                )}

                {/* 4) VERIFY THẤT BẠI hoặc THIẾU TOKEN → HIỆN FORM RESEND */}
                {showResendForm && (
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        {token &&
                            !isPending &&
                            (isError || data?.ok === false) && (
                                <div className="mb-4">
                                    <ResultCard
                                        status="error"
                                        title="Xác thực thất bại"
                                        message={
                                            (error as any)?.response?.data
                                                ?.message ||
                                            data?.message ||
                                            'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.'
                                        }
                                    />
                                </div>
                            )}

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="email">
                                    Nhập email để gửi lại xác thực
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={resendMutation.isPending}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => resendMutation.mutate()}
                                disabled={!email || resendMutation.isPending}>
                                {resendMutation.isPending
                                    ? 'Đang gửi...'
                                    : 'Gửi lại email xác thực'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
