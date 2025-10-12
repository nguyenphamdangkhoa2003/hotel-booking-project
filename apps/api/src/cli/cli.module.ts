import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SyncHotelsCommand } from 'src/command/sync-hotels.command';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { MeilisearchModule } from 'src/modules/search/meilisearch.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MeilisearchModule,
  ],
  providers: [SyncHotelsCommand],
})
export class CliModule {}
