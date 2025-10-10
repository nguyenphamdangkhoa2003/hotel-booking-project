// lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { tokenStore } from './auth-tokens';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Thêm access token vào header trước mỗi request
api.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---- Refresh logic ----
let isRefreshing = false;
let queue: {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    config: AxiosRequestConfig & { _retry?: boolean };
}[] = [];

function processQueue(error: unknown, token: string | null) {
    queue.forEach(({ resolve, reject, config }) => {
        if (error) {
            reject(error);
        } else {
            config.headers = config.headers || {};
            if (token)
                (config.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(config));
        }
    });
    queue = [];
}

async function refreshToken() {
    const refresh = tokenStore.getRefresh();
    if (!refresh) throw new Error('No refresh token found');
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: refresh,
    });
    tokenStore.setAccess(data.accessToken);
    if (data.refreshToken) tokenStore.setRefresh(data.refreshToken); // tuỳ backend có cấp lại hay không
    return data.accessToken;
}

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = (error.config || {}) as AxiosRequestConfig & {
            _retry?: boolean;
        };
        if (error.response?.status !== 401) return Promise.reject(error);

        if (original._retry) {
            tokenStore.clear();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                queue.push({ resolve, reject, config: original });
            });
        }

        original._retry = true;
        isRefreshing = true;

        try {
            const newToken = await refreshToken();
            processQueue(null, newToken);
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            return api(original);
        } catch (err) {
            processQueue(err, null);
            tokenStore.clear();
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
