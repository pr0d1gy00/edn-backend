import { IsOptional, IsArray, IsString, IsUUID, IsEnum, IsNumber } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTourShowDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  venueName?: string;

  @IsOptional()
  @IsString()
  showDate?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  ticketStatus?: TicketStatus;

  @IsOptional()
  @IsString()
  ticketUrl?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  /** Array of image files (optional). New images to upload. */
  @IsOptional()
  files?: Express.Multer.File[];

  /** Sort order for each new file, matching array index. Example: [0, 1] */
  @IsOptional()
  sortOrders?: number[];

  /** IDs of existing images to KEEP. Any image not in this list will be deleted. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingImageIds?: string[];
}