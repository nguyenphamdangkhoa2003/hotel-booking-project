import { Command, CommandRunner } from 'nest-commander';
import { Inject } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { MEILI_CLIENT } from 'src/modules/search/meilisearch.constants';

@Command({ name: 'sync:hotels', description: 'Sync hotel data to Meilisearch' })
export class SyncHotelsCommand extends CommandRunner {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEILI_CLIENT) private readonly meili: MeiliSearch,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('⏳ Syncing hotels to Meilisearch...');
    const hotels = await this.prisma.hotel.findMany({
      include: { location: true },
    });

    const docs = hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.location.city,
      country: h.location.country,
      stars: h.stars,
      priceFrom: h.priceFrom,
      priceTo: h.priceTo,
      amenities: h.amenities,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
    }));

    const index = this.meili.index('hotels');
    await index.deleteAllDocuments();
    await index.addDocuments(docs);

    await index.updateFilterableAttributes([
      'city',
      'country',
      'stars',
      'priceFrom',
      'priceTo',
      'amenities',
    ]);
    await index.updateSearchableAttributes([
      'name',
      'address',
      'city',
      'country',
    ]);
    await index.updateSortableAttributes(['priceFrom', 'stars']);

    console.log(`✅ Synced ${docs.length} hotels to Meilisearch.`);
  }
}
