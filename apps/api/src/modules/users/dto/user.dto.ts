import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: 'b4e0b4f2-8fc2-4a49-b3fd-bad948d2e4a9',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', nullable: true })
  fullName!: string | null;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN', 'MANAGER', 'STAFF'] })
  role!: 'USER' | 'ADMIN' | 'MANAGER' | 'STAFF';
}
