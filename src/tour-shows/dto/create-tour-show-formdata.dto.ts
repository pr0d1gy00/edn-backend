import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTourShowFormDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  venueName: string;

  @IsString()
  showDate: string;

  @IsOptional()
  @IsString()
  ticketStatus?: string;

  @IsOptional()
  @IsString()
  ticketUrl?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  /** JSON array of existing image IDs to keep: '["img-id-1","img-id-2"]' */
  @IsOptional()
  @IsString()
  existingImageIds?: string;
}