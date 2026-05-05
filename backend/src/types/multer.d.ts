declare module "multer" {
  interface MulterFile {
    originalname: string;
  }

  type DiskStorageCallback = (error: Error | null, value: string) => void;

  interface DiskStorageOptions {
    destination?: string | ((request: unknown, file: MulterFile, callback: DiskStorageCallback) => void);
    filename?: (request: unknown, file: MulterFile, callback: DiskStorageCallback) => void;
  }

  export function diskStorage(options: DiskStorageOptions): unknown;
}
