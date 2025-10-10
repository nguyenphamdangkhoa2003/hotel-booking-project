// lib/auth-tokens.ts
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const tokenStore = {
    getAccess() {
        return typeof window !== 'undefined'
            ? localStorage.getItem(ACCESS_KEY)
            : null;
    },
    setAccess(token: string | null) {
        if (typeof window !== 'undefined') {
            token
                ? localStorage.setItem(ACCESS_KEY, token)
                : localStorage.removeItem(ACCESS_KEY);
        }
    },
    getRefresh() {
        return typeof window !== 'undefined'
            ? localStorage.getItem(REFRESH_KEY)
            : null;
    },
    setRefresh(token: string | null) {
        if (typeof window !== 'undefined') {
            token
                ? localStorage.setItem(REFRESH_KEY, token)
                : localStorage.removeItem(REFRESH_KEY);
        }
    },
    clear() {
        this.setAccess(null);
        this.setRefresh(null);
    },
};
