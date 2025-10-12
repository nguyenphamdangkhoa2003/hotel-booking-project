// src/modules/search/dto/search-hotels.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsArray,
  Min,
  Max,
} from 'class-validator';

const toNum = (v: any) =>
  v !== undefined && v !== null ? Number(v) : undefined;
const toArray = (v: any) =>
  Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

export class SearchHotelsDto {
  @ApiPropertyOptional({
    description: 'Full-text query',
    example: 'Hanoi Old Quarter',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Hanoi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Vietnam' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Location ID (UUID/CUID)',
    example: 'loc_abc123',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ type: [String], example: ['wifi', 'pool'] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => toArray(value))
  amenities?: string[];

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  starsMin?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  starsMax?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ example: 2000000 })
  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({
    description: 'sort by priceFrom or stars',
    example: 'priceFrom:asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['priceFrom:asc', 'priceFrom:desc', 'stars:asc', 'stars:desc'], {
    message: 'Invalid sort',
  })
  sort?: 'priceFrom:asc' | 'priceFrom:desc' | 'stars:asc' | 'stars:desc';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
