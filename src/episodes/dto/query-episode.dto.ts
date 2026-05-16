import { IsOptional, IsEnum } from 'class-validator';
import { PlatformType } from '@prisma/client';

export class QueryEpisodeDto {
  @IsOptional()
  @IsEnum(PlatformType)
  platformType?: PlatformType;
}
