'use client';
export default function HotelCard({ hotel }: { hotel: any }) {
    return (
        <div className="rounded-2xl shadow-md overflow-hidden bg-white">
            <img
                src="/placeholder/hotel.jpg"
                alt={hotel.name}
                className="w-full h-48 object-cover"
            />
            <div className="p-4">
                <h3 className="font-semibold text-lg">{hotel.name}</h3>
                <p className="text-gray-500">{hotel.city}</p>
                <p className="mt-2 text-indigo-600 font-medium">
                    {hotel.priceFrom.toLocaleString()}₫ –{' '}
                    {hotel.priceTo.toLocaleString()}₫ / đêm
                </p>
                <p className="text-yellow-500">⭐ {hotel.stars}</p>
            </div>
        </div>
    );
}
