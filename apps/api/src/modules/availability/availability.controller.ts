// apps/api/src/availability/availability.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityQuoteDto,
  AvailabilityQuoteResponse,
} from './dto/quote.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly svc: AvailabilityService) {}
  @Public()
  @Post('quote')
  @ApiOperation({ summary: 'Get availability & price quote for a stay' })
  @ApiOkResponse({ type: AvailabilityQuoteResponse })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  quote(@Body() dto: AvailabilityQuoteDto): Promise<AvailabilityQuoteResponse> {
    return this.svc.quote(dto);
  }
}
