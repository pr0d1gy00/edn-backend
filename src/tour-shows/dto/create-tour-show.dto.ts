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
}
