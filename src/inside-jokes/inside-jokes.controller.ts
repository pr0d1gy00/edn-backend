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
import { InsideJokesService } from './inside-jokes.service';
import { CreateInsideJokeDto } from './dto/create-inside-joke.dto';
import { UpdateInsideJokeDto } from './dto/update-inside-joke.dto';
import { QueryInsideJokeDto } from './dto/query-inside-joke.dto';

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
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInsideJokeDto) {
    return this.insideJokesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsideJokeDto) {
    return this.insideJokesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insideJokesService.remove(id);
  }
}
