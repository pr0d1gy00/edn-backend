import { PartialType } from '@nestjs/mapped-types';
import { CreateTourShowDto } from './create-tour-show.dto';

export class UpdateTourShowDto extends PartialType(CreateTourShowDto) {}
