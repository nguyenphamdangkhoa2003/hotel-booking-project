import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email of the user',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description: 'Password with minimum length 8',
    minLength: 8,
  })
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Full name for display',
  })
  @IsNotEmpty()
  fullName!: string;
}
