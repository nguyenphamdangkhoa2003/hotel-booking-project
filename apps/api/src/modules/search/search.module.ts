// src/modules/search/search.module.ts
import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MeilisearchModule } from 'src/modules/search/meilisearch.module';
import { MeilisearchService } from 'src/modules/search/meilisearch.service';

@Module({
  imports: [MeilisearchModule],
  controllers: [SearchController],
  providers: [SearchService, MeilisearchService],
})
export class SearchModule {}
