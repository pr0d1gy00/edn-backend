import { IsEnum, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { MediaEntityType } from '@prisma/client';

export class CreateMediaDto {
  @IsEnum(MediaEntityType)
  @IsNotEmpty()
  entityType: MediaEntityType;

  @IsNotEmpty()
  entityId: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
