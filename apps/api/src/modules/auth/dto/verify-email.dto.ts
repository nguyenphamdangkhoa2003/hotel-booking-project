import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  @IsString()
  @Length(64, 64)
  token: string; // 32 bytes hex = 64 chars
}
