import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateInsideJokeDto } from './create-inside-joke.dto';

export class UpdateInsideJokeDto extends OmitType(
  PartialType(CreateInsideJokeDto),
  ['episodeId'] as const,
) {}
