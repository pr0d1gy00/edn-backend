import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTourShowDto {
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

  @IsDateString()
  showDate: string;

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

  @IsOptional()
  existingImageIds?: string[]; // IDs of existing images to keep (optional)

  /** Array of image files (optional). Frontend sends as multipart. */
  @IsOptional()
  files?: Express.Multer.File[];

  /** Sort order for each file, matching array index. Example: [0, 1, 2] */
  @IsOptional()
  sortOrders?: number[];

} 
