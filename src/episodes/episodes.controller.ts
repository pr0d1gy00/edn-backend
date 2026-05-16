import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { QueryEpisodeDto } from './dto/query-episode.dto';

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  findAll(@Query() query: QueryEpisodeDto) {
    return this.episodesService.findAll(query.platformType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.episodesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEpisodeDto) {
    return this.episodesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEpisodeDto) {
    return this.episodesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.episodesService.remove(id);
  }

  @Get(':episodeId/guests')
  getGuests(@Param('episodeId') episodeId: string) {
    return this.episodesService.getGuests(episodeId);
  }

  @Post(':episodeId/guests/:guestId')
  addGuest(
    @Param('episodeId') episodeId: string,
    @Param('guestId') guestId: string,
  ) {
    return this.episodesService.addGuest(episodeId, guestId);
  }

  @Delete(':episodeId/guests/:guestId')
  removeGuest(
    @Param('episodeId') episodeId: string,
    @Param('guestId') guestId: string,
  ) {
    return this.episodesService.removeGuest(episodeId, guestId);
  }
}
