import { Injectable } from '@nestjs/common';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { MeilisearchService } from 'src/modules/search/meilisearch.service';

@Injectable()
export class SearchService {
  constructor(private readonly meili: MeilisearchService) {}

  async searchHotels(dto: SearchHotelsDto) {
    const index = this.meili.getHotelsIndex();

    const {
      q,
      city,
      country,
      locationId,
      amenities,
      starsMin,
      starsMax,
      priceMin,
      priceMax,
      sort,
      page = 1,
      limit = 20,
    } = dto;

    // Meili filters: dùng mảng string, mỗi string là 1 nhóm AND
    const filters: string[] = [];
    if (city) filters.push(`city = "${city}"`);
    if (country) filters.push(`country = "${country}"`);
    if (locationId) filters.push(`locationId = "${locationId}"`);
    if (typeof starsMin === 'number') filters.push(`stars >= ${starsMin}`);
    if (typeof starsMax === 'number') filters.push(`stars <= ${starsMax}`);
    if (typeof priceMin === 'number') filters.push(`priceFrom >= ${priceMin}`);
    if (typeof priceMax === 'number') filters.push(`priceTo <= ${priceMax}`);
    if (amenities?.length) {
      // amenities là text[] → lọc phần tử giao nhau
      // Meili gợi ý cú pháp: amenities IN ["wifi","pool"]
      filters.push(
        `amenities IN [${amenities.map((a) => `"${a}"`).join(',')}]`,
      );
    }

    const sortOpt = sort ? [sort] : undefined;
    const offset = (page - 1) * limit;

    const res = await index.search(q ?? '', {
      filter: filters.length ? filters : undefined,
      sort: sortOpt,
      limit,
      offset,
      attributesToRetrieve: [
        'id',
        'name',
        'address',
        'city',
        'country',
        'stars',
        'latitude',
        'longitude',
        'amenities',
        'priceFrom',
        'priceTo',
        'locationId',
        'thumbnailUrl',
      ],
    });

    return {
      data: res.hits,
      meta: {
        page,
        limit,
        total: res.estimatedTotalHits ?? res.hits.length,
        totalPages: Math.max(
          1,
          Math.ceil((res.estimatedTotalHits ?? 0) / limit),
        ),
        processingTimeMs: res.processingTimeMs,
        query: q ?? '',
      },
    };
  }
}
