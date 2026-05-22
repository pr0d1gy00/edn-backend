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
import { CreateEpisodeFormDataDto } from './dto/create-episode-formdata.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { QueryEpisodeDto } from './dto/query-episode.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  findAll(@Query() query: QueryEpisodeDto) {
    return this.episodesService.findAll(
      query.platformType,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.episodesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() formData: CreateEpisodeFormDataDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = this.parseFormData(formData);
    dto.files = files ?? [];
    return this.episodesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  update(
    @Param('id') id: string,
    @Body() formData: CreateEpisodeFormDataDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = this.parseFormData(formData);
    dto.files = files ?? [];
    return this.episodesService.update(id, dto);
  }

  private parseFormData(formData: CreateEpisodeFormDataDto): CreateEpisodeDto {
    return {
      title: formData.title,
      platformType: formData.platformType as any,
      contentUrl: formData.contentUrl,
      publishedAt: formData.publishedAt,
      episodeNumber: formData.episodeNumber
        ? parseInt(formData.episodeNumber, 10)
        : undefined,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      isExclusive: formData.isExclusive === 'true',
      durationSeconds: formData.durationSeconds
        ? parseInt(formData.durationSeconds, 10)
        : undefined,
      existingImageIds: formData.existingImageIds
        ? JSON.parse(formData.existingImageIds)
        : undefined,
    } as CreateEpisodeDto;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
