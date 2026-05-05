import { IsIn, IsOptional } from "class-validator";

export type FileStatusFilter = "all" | "active" | "expired";

export class ListFilesQueryDto {
  @IsOptional()
  @IsIn(["all", "active", "expired"])
  status: FileStatusFilter = "active";
}
