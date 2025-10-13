import api from '@/lib/axios';

export type PublicUser = {
    id: string;
    email: string;
    name?: string;
    avatar?: ImageAsset;
    role?: string;
};
type ImageAsset = {
    id: string;

    // Cloudinary / external core
    publicId: string;
    url: string;
    secureUrl: string | null;
    format: string | null; // vd: 'jpg' | 'webp' | 'external'
    width: number | null;
    height: number | null;
    bytes: number | null;
    folder: string | null;
    version: number | null;
    etag: string | null;

    // SEO/UX
    alt: string | null;
    caption: string | null;
    placeholder: string | null; // base64 blur
    metadata: unknown | null; // raw JSON từ provider

    createdAt: string; // ISO datetime
    updatedAt: string; // ISO datetime
};

export async function fetchMe(): Promise<PublicUser> {
    // Backend của bạn nên có /auth/me trả về user hiện tại
    const { data } = await api.get('/auth/me');
    console.log(data.user);
    return data.user;
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
    try {
        await api.post('/auth/logout');
    } catch {}
}
