import { IsOptional, IsEnum, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketStatus } from '@prisma/client';

export class QueryTourShowDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  ticketStatus?: TicketStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  upcoming?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}