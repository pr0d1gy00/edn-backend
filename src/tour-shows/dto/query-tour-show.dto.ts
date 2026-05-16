import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
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
}
