import api from '@/lib/axios';

export type PublicUser = {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: string;
};

export async function fetchMe(): Promise<PublicUser> {
    // Backend của bạn nên có /auth/me trả về user hiện tại
    const { data } = await api.get('/auth/me');
    return data;
}

export async function signIn(payload: { email: string; password: string }) {
    // Trả về { accessToken, refreshToken, user }
    const { data } = await api.post('/auth/login', payload);
    return data as {
        accessToken: string;
        refreshToken: string;
        user: PublicUser;
    };
}

export async function signOutServer() {
    // (tuỳ backend có endpoint revoke refresh token)
    try {
        await api.post('/auth/logout');
    } catch {}
}
