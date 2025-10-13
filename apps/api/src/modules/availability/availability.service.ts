// apps/api/src/availability/availability.service.ts
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  AvailabilityQuoteDto,
  AvailabilityQuoteResponse,
  RoomQuote,
} from './dto/quote.dto';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  isBefore,
} from 'date-fns';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async quote(dto: AvailabilityQuoteDto): Promise<AvailabilityQuoteResponse> {
    const checkIn = parseISO(dto.checkIn);
    const checkOut = parseISO(dto.checkOut);
    if (!checkIn || !checkOut || isBefore(checkOut, checkIn))
      throw new BadRequestException('checkOut must be after checkIn');

    const nights = differenceInCalendarDays(checkOut, checkIn);
    if (nights <= 0) throw new BadRequestException('Nights must be >= 1');
    if (nights > 30) throw new BadRequestException('Max 30 nights');

    const cacheKey = `avail:${dto.hotelId}:${format(checkIn, 'yyyyMMdd')}-${format(checkOut, 'yyyyMMdd')}:${dto.guests}`;
    const cached = await this.cache.get<AvailabilityQuoteResponse>(cacheKey);
    if (cached) return cached;

    // 1) Lấy RoomTypes thuộc hotel & đủ capacity
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId: dto.hotelId, capacity: { gte: dto.guests } },
      select: { id: true, name: true, capacity: true, basePrice: true },
    });
    if (roomTypes.length === 0) {
      const empty: AvailabilityQuoteResponse = {
        nights,
        rooms: [],
        currency: 'VND',
      };
      await this.cache.set(cacheKey, empty);
      return empty;
    }

    const days = eachDayOfInterval({
      start: checkIn,
      end: new Date(checkOut.getTime() - 86400000),
    });

    // 2) Lấy inventory và price cho tất cả roomTypes & ngày
    const [inventories, prices] = await Promise.all([
      this.prisma.inventory.findMany({
        where: {
          roomTypeId: { in: roomTypes.map((r) => r.id) },
          date: { gte: checkIn, lt: checkOut },
        },
        select: { roomTypeId: true, date: true, available: true },
      }),
      this.prisma.priceCalendar.findMany({
        where: {
          roomTypeId: { in: roomTypes.map((r) => r.id) },
          date: { gte: checkIn, lt: checkOut },
        },
        select: { roomTypeId: true, date: true, price: true },
      }),
    ]);

    const invMap = new Map<string, number>(); // key: `${roomTypeId}-${yyyyMMdd}`
    for (const i of inventories)
      invMap.set(`${i.roomTypeId}-${format(i.date, 'yyyyMMdd')}`, i.available);

    const priceMap = new Map<string, number>();
    for (const p of prices)
      priceMap.set(`${p.roomTypeId}-${format(p.date, 'yyyyMMdd')}`, p.price);

    // 3) Tính quote cho từng room type
    const rooms: RoomQuote[] = roomTypes
      .map((rt) => {
        let okAll = true;
        let total = 0;
        const breakdown = days.map((d) => {
          const key = `${rt.id}-${format(d, 'yyyyMMdd')}`;
          const avail = invMap.get(key) ?? 0;
          if (avail <= 0) okAll = false;
          const price = priceMap.get(key) ?? rt.basePrice;
          total += price;
          return { date: format(d, 'yyyy-MM-dd'), price };
        });
        return {
          roomTypeId: rt.id,
          name: rt.name,
          capacity: rt.capacity,
          total,
          breakdown,
          availableAllNights: okAll,
        };
      })
      .filter((r) => r.availableAllNights);

    const resp: AvailabilityQuoteResponse = { nights, rooms, currency: 'VND' };
    await this.cache.set(cacheKey, resp);
    return resp;
  }
}
