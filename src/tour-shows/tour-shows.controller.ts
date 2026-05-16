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
} from '@nestjs/common';
import { TourShowsService } from './tour-shows.service';
import { CreateTourShowDto } from './dto/create-tour-show.dto';
import { UpdateTourShowDto } from './dto/update-tour-show.dto';
import { QueryTourShowDto } from './dto/query-tour-show.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTourShowDto) {
    return this.tourShowsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTourShowDto) {
    return this.tourShowsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tourShowsService.remove(id);
  }
}
