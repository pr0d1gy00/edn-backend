import { IsIn, IsString } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsIn(['1', '-1', '0'])
  voteValue: string;
}