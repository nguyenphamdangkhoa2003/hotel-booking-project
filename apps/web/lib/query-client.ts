import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: 1, staleTime: 60_000 },
            mutations: { retry: 0 },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

/** Lấy 1 instance duy nhất cho browser, server tạo mới mỗi request */
export function getQueryClient() {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}
