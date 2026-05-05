import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  sharePassword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  expirationDays?: number;

  @IsOptional()
  @Transform(({ value }) => parseTags(value))
  @IsArray()
  @ArrayUnique()
  @MaxLength(30, { each: true })
  tags?: string[];
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return normalizeTags(value.flatMap((entry) => String(entry).split(",")));
  }

  const rawValue = String(value);

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (Array.isArray(parsed)) {
      return normalizeTags(parsed.map((entry) => String(entry)));
    }
  } catch {
    // Multipart clients may send tags as a simple comma-separated field.
  }

  return normalizeTags(rawValue.split(","));
}

function normalizeTags(values: string[]): string[] {
  return values.map((tag) => tag.trim()).filter(Boolean);
}
