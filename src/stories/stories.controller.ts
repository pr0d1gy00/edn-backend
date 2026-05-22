import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { QueryStoryDto } from './dto/query-story.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  findAll(@Query() query: QueryStoryDto) {
    return this.storiesService.findAll(query);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  findAllAdmin(@Query() query: QueryStoryDto) {
    return this.storiesService.findAllAdmin(query);
  }

  @Get(':id/admin')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  findOneAdmin(@Param('id') id: string) {
    return this.storiesService.findOneAdmin(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStoryDto) {
    return this.storiesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateStoryDto) {
    return this.storiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.storiesService.remove(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  approve(@Param('id') id: string) {
    return this.storiesService.approve(id);
  }

  @Delete(':id/reject')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  reject(@Param('id') id: string) {
    return this.storiesService.reject(id);
  }
}
