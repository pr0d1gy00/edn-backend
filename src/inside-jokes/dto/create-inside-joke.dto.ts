import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateInsideJokeDto {
  @IsUUID()
  episodeId: string;

  @IsString()
  @IsNotEmpty()
  startTimeStamp: string;

  @IsOptional()
  @IsString()
  endTimeStamp?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  keyConcept: string;

  @IsString()
  @IsNotEmpty()
  transcriptContext: string;
}
