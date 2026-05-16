import { Module } from '@nestjs/common';
import { TourShowsService } from './tour-shows.service';
import { TourShowsController } from './tour-shows.controller';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [TourShowsController],
  providers: [TourShowsService],
  exports: [TourShowsService],
})
export class TourShowsModule {}
