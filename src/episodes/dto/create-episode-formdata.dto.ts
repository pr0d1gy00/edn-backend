import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { PlatformType } from '@prisma/client';

export class CreateEpisodeFormDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(PlatformType)
  platformType: PlatformType;

  @IsString()
  @IsNotEmpty()
  contentUrl: string;

  @IsString()
  publishedAt: string;

  @IsOptional()
  @IsString()
  episodeNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  isExclusive?: string;

  @IsOptional()
  @IsString()
  durationSeconds?: string;
}