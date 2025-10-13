import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { seconds, Throttle } from '@nestjs/throttler';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}
  @Throttle({ default: { limit: 30, ttl: seconds(60) } })
  @Public()
  @Get('hotels')
  @ApiOperation({ summary: 'Search hotels by text & filters' })
  @ApiOkResponse({
    description: 'List of hotels',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            processingTimeMs: { type: 'number' },
            query: { type: 'string' },
          },
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async search(@Query() dto: SearchHotelsDto) {
    return this.service.searchHotels(dto);
  }
}
