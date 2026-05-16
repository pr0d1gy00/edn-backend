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
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { QueryEpisodeDto } from './dto/query-episode.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateEpisodeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    dto.files = files ?? [];
    return this.episodesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEpisodeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    dto.files = files ?? [];
    return this.episodesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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
