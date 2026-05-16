import { Module } from '@nestjs/common';
import { EpisodesModule } from '../episodes/episodes.module';
import { InsideJokesService } from './inside-jokes.service';
import { InsideJokesController } from './inside-jokes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EpisodesModule, AuthModule],
  controllers: [InsideJokesController],
  providers: [InsideJokesService],
})
export class InsideJokesModule {}
