'use client';

import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

export type SearchParams = {
    destination?: string;
    guests?: number;
    rooms?: number;
    checkIn?: string;
    checkOut?: string;
    page?: number;
    limit?: number;
    sort?: string;
};

export async function fetchHotels(params: SearchParams) {
    const { destination } = params;
    const res = await api.get('/search/hotels', {
        params: {
            q: destination,
        },
    });
    return res.data;
}

export function useSearchHotels(params: SearchParams) {
    return useQuery({
        queryKey: ['hotels', params],
        queryFn: () => fetchHotels(params),
        enabled: !!params.destination,
        staleTime: 1000 * 60 * 5, // 5 phút
    });
}
