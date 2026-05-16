import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { PlatformType } from '@prisma/client';

export class CreateEpisodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(PlatformType)
  platformType: PlatformType;

  @IsString()
  @IsNotEmpty()
  contentUrl: string;

  @IsDateString()
  publishedAt: string;

  @IsOptional()
  @IsInt()
  episodeNumber?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
