import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoryVote } from '@prisma/client';

export class VoteResponseDto {
  storyId: string;
  score: number;
  userVote: number | null;
}

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async castVote(
    storyId: string,
    userId: string,
    voteValue: number,
  ): Promise<VoteResponseDto> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${storyId}" not found`);
    }

    // Upsert the vote
    const vote = await this.prisma.storyVote.upsert({
      where: { userId_storyId: { userId, storyId } },
      create: { userId, storyId, voteValue },
      update: { voteValue },
    });

    // Calculate new score
    const result = await this.prisma.storyVote.aggregate({
      where: { storyId },
      _sum: { voteValue: true },
    });

    return {
      storyId,
      score: result._sum.voteValue ?? 0,
      userVote: vote.voteValue,
    };
  }

  async getUserVote(
    storyId: string,
    userId: string,
  ): Promise<StoryVote | null> {
    return this.prisma.storyVote.findUnique({
      where: { userId_storyId: { userId, storyId } },
    });
  }

  async removeVote(storyId: string, userId: string): Promise<VoteResponseDto> {
    const vote = await this.prisma.storyVote.findUnique({
      where: { userId_storyId: { userId, storyId } },
    });

    if (!vote) {
      throw new NotFoundException(
        `Vote by user "${userId}" on story "${storyId}" not found`,
      );
    }

    await this.prisma.storyVote.delete({
      where: { userId_storyId: { userId, storyId } },
    });

    // Calculate new score
    const result = await this.prisma.storyVote.aggregate({
      where: { storyId },
      _sum: { voteValue: true },
    });

    return {
      storyId,
      score: result._sum.voteValue ?? 0,
      userVote: null,
    };
  }

  async getVoteScore(storyId: string): Promise<{ score: number }> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${storyId}" not found`);
    }

    const result = await this.prisma.storyVote.aggregate({
      where: { storyId },
      _sum: { voteValue: true },
    });

    return { score: result._sum.voteValue ?? 0 };
  }
}