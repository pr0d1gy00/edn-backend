import { IsUUID } from 'class-validator';

export class RemoveGuestDto {
  @IsUUID()
  guestId: string;
}
