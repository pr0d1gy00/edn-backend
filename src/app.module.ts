import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StoriesModule } from './stories/stories.module';
import { VotesModule } from './votes/votes.module';
import { EpisodesModule } from './episodes/episodes.module';
import { GuestsModule } from './guests/guests.module';
import { InsideJokesModule } from './inside-jokes/inside-jokes.module';
import { TourShowsModule } from './tour-shows/tour-shows.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [PrismaModule, UsersModule, StoriesModule, VotesModule, EpisodesModule, GuestsModule, InsideJokesModule, TourShowsModule, MediaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
