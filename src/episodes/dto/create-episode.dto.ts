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

  /** Array of image files (optional). Frontend sends as multipart. */
  @IsOptional()
  files?: Express.Multer.File[];

  /** Sort order for each file, matching array index. Example: [0, 1, 2] */
  @IsOptional()
  sortOrders?: number[];
}
