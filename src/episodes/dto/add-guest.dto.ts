import { IsUUID } from 'class-validator';

export class AddGuestDto {
  @IsUUID()
  guestId: string;
}
