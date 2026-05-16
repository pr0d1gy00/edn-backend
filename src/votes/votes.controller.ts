import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@Controller()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('stories/:id/vote')
  @HttpCode(HttpStatus.CREATED)
  castVote(@Param('id') storyId: string, @Body() dto: CreateVoteDto) {
    return this.votesService.castVote(storyId, dto.userId, dto.voteValue);
  }

  @Delete('stories/:id/vote')
  removeVote(@Param('id') storyId: string, @Body() dto: CreateVoteDto) {
    return this.votesService.removeVote(storyId, dto.userId);
  }

  @Get('votes/story/:id/score')
  getVoteScore(@Param('id') storyId: string) {
    return this.votesService.getVoteScore(storyId);
  }
}
