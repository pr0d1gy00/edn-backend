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
import { StoryPromptsService } from './story-prompts.service';
import { CreateStoryPromptDto } from './dto/create-story-prompt.dto';
import { UpdateStoryPromptDto } from './dto/update-story-prompt.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('story-prompts')
export class StoryPromptsController {
  constructor(
    private readonly storyPromptsService: StoryPromptsService,
  ) {}

  @Get()
  findOpen() {
    return this.storyPromptsService.findOpen(false);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAllAdmin(@Query('includeAll') includeAll?: string) {
    if (includeAll === 'true') {
      return this.storyPromptsService.findOpen(true);
    }
    return this.storyPromptsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storyPromptsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStoryPromptDto) {
    return this.storyPromptsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateStoryPromptDto) {
    return this.storyPromptsService.update(id, dto);
  }

  @Post(':id/open')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  open(@Param('id') id: string) {
    return this.storyPromptsService.open(id);
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  close(@Param('id') id: string) {
    return this.storyPromptsService.close(id);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  publish(@Param('id') id: string) {
    return this.storyPromptsService.publish(id);
  }

  @Post(':id/unpublish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  unpublish(@Param('id') id: string) {
    return this.storyPromptsService.unpublish(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.storyPromptsService.remove(id);
  }
}
