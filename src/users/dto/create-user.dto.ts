import {
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  IsEnum,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
