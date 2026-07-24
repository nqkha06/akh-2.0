import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const nullableParentId = ({ value }: { value: unknown }) =>
  value === "" || value === "root" || value === null ? null : value;

export class CreateAdminMediaFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @Transform(nullableParentId)
  @IsString()
  @MaxLength(80)
  parentId?: string | null;
}

export class UpdateAdminMediaFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(nullableParentId)
  @IsString()
  @MaxLength(80)
  parentId?: string | null;
}
