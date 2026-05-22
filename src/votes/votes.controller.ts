import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // Cast or update user's vote
  @Post('stories/:storyId/vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  castVote(
    @Param('storyId') storyId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVoteDto,
  ) {
    const voteValue = parseInt(dto.voteValue, 10);
    if (voteValue === 0) {
      // 0 means remove the vote
      return this.votesService.removeVote(storyId, user.id);
    }
    return this.votesService.castVote(storyId, user.id, voteValue);
  }

  // Get user's vote on a story
  @Get('stories/:storyId/vote')
  @UseGuards(JwtAuthGuard)
  getUserVote(
    @Param('storyId') storyId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.votesService.getUserVote(storyId, user.id);
  }

  // Remove user's vote
  @Delete('stories/:storyId/vote')
  @UseGuards(JwtAuthGuard)
  removeVote(
    @Param('storyId') storyId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.votesService.removeVote(storyId, user.id);
  }

  // Get total vote score for a story (public)
  @Get('stories/:storyId/vote/score')
  getVoteScore(@Param('storyId') storyId: string) {
    return this.votesService.getVoteScore(storyId);
  }
}