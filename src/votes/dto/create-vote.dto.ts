import { IsUUID, IsInt, IsIn, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsInt()
  @IsIn([1, -1])
  voteValue: number;
}
