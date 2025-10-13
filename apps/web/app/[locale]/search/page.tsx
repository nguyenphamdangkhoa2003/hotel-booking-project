'use client';
import HotelCard from '@/components/hotel-card';
import Loader from '@/components/kokonutui/loader';
import { SearchParams, useSearchHotels } from '@/hooks/use-search-hotels';
import React from 'react';

export default function SearchPage({ searchParams }: { searchParams: any }) {
    const sp = React.use<SearchParams>(searchParams);

    const params = {
        destination: sp.destination ?? '',
        guests: Number(sp.guests ?? 1),
        rooms: Number(sp.rooms ?? 1),
        checkIn: sp.checkIn ?? '',
        checkOut: sp.checkOut ?? '',
    };

    const { data, isLoading, isError } = useSearchHotels(params);
    if (data) console.log(data);
    return (
        <section className="container mx-auto flex justify-center items-center h-screen">
            {isLoading && <Loader />}
            {isError && <p className="text-red-500">Không thể tải dữ liệu</p>}
            {data && (
                <>
                    <h1 className="text-2xl font-bold mb-6">
                        Kết quả tìm kiếm cho "{params.destination}"
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data?.data?.map((hotel: any) => (
                            <HotelCard key={hotel.id} hotel={hotel} />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
