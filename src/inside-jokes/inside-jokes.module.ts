import { Module } from '@nestjs/common';
import { EpisodesModule } from '../episodes/episodes.module';
import { InsideJokesService } from './inside-jokes.service';
import { InsideJokesController } from './inside-jokes.controller';

@Module({
  imports: [EpisodesModule],
  controllers: [InsideJokesController],
  providers: [InsideJokesService],
})
export class InsideJokesModule {}
