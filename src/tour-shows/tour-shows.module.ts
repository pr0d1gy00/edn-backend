import { Module } from '@nestjs/common';
import { TourShowsService } from './tour-shows.service';
import { TourShowsController } from './tour-shows.controller';

@Module({
  controllers: [TourShowsController],
  providers: [TourShowsService],
  exports: [TourShowsService],
})
export class TourShowsModule {}
