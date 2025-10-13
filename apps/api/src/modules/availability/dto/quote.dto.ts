// apps/api/src/availability/dto/quote.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsPositive, IsString, isString, IsUUID, Min } from 'class-validator';

export class AvailabilityQuoteDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  hotelId!: string;

  @ApiProperty({ example: '2025-10-15' })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: '2025-10-18' })
  @IsDateString()
  checkOut!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  guests!: number;
}

export class PriceBreakdown {
  @ApiProperty() date!: string; // YYYY-MM-DD
  @ApiProperty() price!: number; // VND
}

export class RoomQuote {
  @ApiProperty() roomTypeId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() capacity!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [PriceBreakdown] }) breakdown!: PriceBreakdown[];
  @ApiProperty() availableAllNights!: boolean;
}

export class AvailabilityQuoteResponse {
  @ApiProperty() nights!: number;
  @ApiProperty({ type: [RoomQuote] }) rooms!: RoomQuote[];
  @ApiProperty() currency!: string;
}
