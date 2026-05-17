import { Module, forwardRef } from '@nestjs/common';
import { StoryPromptsService } from './story-prompts.service';
import { StoryPromptsController } from './story-prompts.controller';
import { AuthModule } from '../auth/auth.module';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [AuthModule, forwardRef(() => StoriesModule)],
  controllers: [StoryPromptsController],
  providers: [StoryPromptsService],
  exports: [StoryPromptsService],
})
export class StoryPromptsModule {}
