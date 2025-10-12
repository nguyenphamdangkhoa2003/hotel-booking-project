import { Injectable, Inject } from '@nestjs/common';
import { Index, MeiliSearch } from 'meilisearch';
import { MEILI_CLIENT } from './meilisearch.constants';

@Injectable()
export class MeilisearchService {
  private hotelsIndex: Index;

  constructor(@Inject(MEILI_CLIENT) private readonly client: MeiliSearch) {
    this.hotelsIndex = this.client.index('hotels');
  }
  async onModuleInit() {
    await this.ensureIndexes();
  }
  async ensureIndexes() {
    await this.hotelsIndex.updateFilterableAttributes([
      'city',
      'country',
      'stars',
      'priceFrom',
      'priceTo',
      'amenities',
      'locationId',
    ]);
    await this.hotelsIndex.updateSearchableAttributes([
      'name',
      'address',
      'city',
      'country',
    ]);
    await this.hotelsIndex.updateSortableAttributes(['priceFrom', 'stars']);
  }

  async addHotels(data: any[]) {
    return this.hotelsIndex.addDocuments(data);
  }

  async clearHotels() {
    await this.hotelsIndex.deleteAllDocuments();
  }

  getHotelsIndex(): Index {
    return this.hotelsIndex;
  }
}
