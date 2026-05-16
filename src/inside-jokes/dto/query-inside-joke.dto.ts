import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryInsideJokeDto {
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @IsOptional()
  @IsString()
  keyConcept?: string;
}
