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
import { TourShowsService } from './tour-shows.service';
import { CreateTourShowDto } from './dto/create-tour-show.dto';
import { CreateTourShowFormDataDto } from './dto/create-tour-show-formdata.dto';
import { UpdateTourShowDto } from './dto/update-tour-show.dto';
import { QueryTourShowDto } from './dto/query-tour-show.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('tour-shows')
export class TourShowsController {
  constructor(private readonly tourShowsService: TourShowsService) {}

  @Get()
  findAll(@Query() query: QueryTourShowDto) {
    return this.tourShowsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tourShowsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() formData: CreateTourShowFormDataDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = this.parseFormData(formData);
    dto.files = files ?? [];
    return this.tourShowsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  update(
    @Param('id') id: string,
    @Body() formData: CreateTourShowFormDataDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = this.parseFormData(formData);
    dto.files = files ?? [];
    return this.tourShowsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.tourShowsService.remove(id);
  }

  private parseFormData(formData: CreateTourShowFormDataDto): CreateTourShowDto {
    return {
      city: formData.city,
      country: formData.country,
      venueName: formData.venueName,
      showDate: formData.showDate,
      ticketStatus: formData.ticketStatus as any,
      ticketUrl: formData.ticketUrl,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      existingImageIds: formData.existingImageIds
        ? JSON.parse(formData.existingImageIds)
        : undefined,
    };
  }
}
