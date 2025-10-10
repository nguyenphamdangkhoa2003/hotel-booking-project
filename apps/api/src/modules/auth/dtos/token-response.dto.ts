import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOi...', description: 'Refresh token' })
  refreshToken!: string;
}
