import { Module, forwardRef } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { AuthModule } from '../auth/auth.module';
import { StoryPromptsModule } from '../story-prompts/story-prompts.module';

@Module({
  imports: [AuthModule, forwardRef(() => StoryPromptsModule)],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
