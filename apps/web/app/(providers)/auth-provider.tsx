// app/(providers)/auth-provider.tsx (client)
'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenStore } from '@/lib/auth-tokens';
import { authKeys } from '@/api/auth/auth.keys';
import { fetchMe, PublicUser, signIn, signOutServer } from '@/api/auth/auth.api';

type AuthContextType = {
    user: PublicUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refetchMe: () => Promise<PublicUser | undefined>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const qc = useQueryClient();

    // Chỉ fetch /me khi có access token trong localStorage (client-side)
    const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

    const {
        data: me,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: authKeys.me(),
        queryFn: fetchMe,
        enabled: hasToken, // nếu chưa có token thì khỏi gọi /me
        staleTime: 5 * 60 * 1000, // 5 phút
        retry: (failureCount, err: any) => {
            // Nếu 401 đã được interceptor xử lý refresh; nếu vẫn lỗi nhiều lần thì dừng
            if (err?.response?.status === 401) return false;
            return failureCount < 1;
        },
    });

    // Đăng nhập: set token, warm cache
    const loginMutation = useMutation({
        mutationFn: ({
            email,
            password,
        }: {
            email: string;
            password: string;
        }) => signIn({ email, password }),
        onSuccess: async (res) => {
            tokenStore.setAccess(res.accessToken);
            tokenStore.setRefresh(res.refreshToken);
            // Đưa user vào cache để UI có ngay dữ liệu
            qc.setQueryData(authKeys.me(), res.user);
            // Hoặc refetch để đồng bộ hoàn toàn từ server
            await qc.invalidateQueries({ queryKey: authKeys.me() });
        },
    });

    // Đăng xuất: clear token, clear cache
    const doLogout = async () => {
        await signOutServer().catch(() => {});
        tokenStore.clear();
        await qc.resetQueries({ queryKey: authKeys.all });
    };

    // Cross-tab logout/login bằng storage event
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'accessToken' || e.key === 'refreshToken') {
                // Khi token đổi ở tab khác → làm mới /me
                qc.invalidateQueries({ queryKey: authKeys.me() });
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [qc]);

    const value = useMemo<AuthContextType>(
        () => ({
            user: me ?? null,
            isLoading,
            isAuthenticated: !!me,
            login: async (email, password) => {
                await loginMutation.mutateAsync({ email, password });
            },
            logout: doLogout,
            refetchMe: async () => {
                const r = await refetch();
                return r.data;
            },
        }),
        [me, isLoading, loginMutation, refetch]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
