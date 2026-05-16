import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StoryVote } from '@prisma/client';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async castVote(
    storyId: string,
    userId: string,
    voteValue: number,
  ): Promise<StoryVote> {
    const story = await this.prisma.communityStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${storyId}" not found`);
    }

    return this.prisma.storyVote.upsert({
      where: { userId_storyId: { userId, storyId } },
      create: { userId, storyId, voteValue },
      update: { voteValue },
    });
  }

  async removeVote(storyId: string, userId: string): Promise<StoryVote> {
    const vote = await this.prisma.storyVote.findUnique({
      where: { userId_storyId: { userId, storyId } },
    });

    if (!vote) {
      throw new NotFoundException(
        `Vote by user "${userId}" on story "${storyId}" not found`,
      );
    }

    return this.prisma.storyVote.delete({
      where: { userId_storyId: { userId, storyId } },
    });
  }

  async getVoteScore(storyId: string): Promise<{ score: number }> {
    const result = await this.prisma.storyVote.aggregate({
      where: { storyId },
      _sum: { voteValue: true },
    });

    return { score: result._sum.voteValue ?? 0 };
  }
}
