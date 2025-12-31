import { IsEnum, IsOptional } from 'class-validator';
import { DesignStatus } from '../schemas/design.schema';

export class UpdateDesignDto {
  @IsOptional()
  @IsEnum(DesignStatus)
  status?: DesignStatus;
}
