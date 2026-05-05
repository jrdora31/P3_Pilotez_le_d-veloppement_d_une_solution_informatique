import { promises as fs } from "node:fs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class LocalFileStorageService {
  async deleteFile(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
