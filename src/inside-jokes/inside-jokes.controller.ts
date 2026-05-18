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
import { InsideJokesService } from './inside-jokes.service';
import { CreateInsideJokeDto } from './dto/create-inside-joke.dto';
import { UpdateInsideJokeDto } from './dto/update-inside-joke.dto';
import { QueryInsideJokeDto } from './dto/query-inside-joke.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('inside-jokes')
export class InsideJokesController {
  constructor(private readonly insideJokesService: InsideJokesService) {}

  @Get()
  findAll(@Query() query: QueryInsideJokeDto) {
    return this.insideJokesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insideJokesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInsideJokeDto) {
    return this.insideJokesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateInsideJokeDto) {
    return this.insideJokesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.insideJokesService.remove(id);
  }
}
