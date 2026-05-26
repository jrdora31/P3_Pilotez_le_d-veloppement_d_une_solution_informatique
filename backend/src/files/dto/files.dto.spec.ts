import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DownloadFileDto } from "./download-file.dto";
import { ListFilesQueryDto } from "./list-files-query.dto";
import { UploadFileDto } from "./upload-file.dto";

describe("Files DTO", () => {
  it("transforme les champs multipart d'upload en types attendus", async () => {
    const dto = plainToInstance(UploadFileDto, {
      expirationDays: "3",
      sharePassword: "secret1",
      tags: "projet, urgent, projet-api"
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.expirationDays).toBe(3);
    expect(dto.tags).toEqual(["projet", "urgent", "projet-api"]);
  });

  it("accepte les tags envoyes sous forme JSON ou tableau multipart", async () => {
    const jsonDto = plainToInstance(UploadFileDto, {
      tags: '["projet","urgent"]'
    });
    const arrayDto = plainToInstance(UploadFileDto, {
      tags: ["projet, urgent", "finance"]
    });

    await expect(validate(jsonDto)).resolves.toHaveLength(0);
    await expect(validate(arrayDto)).resolves.toHaveLength(0);
    expect(jsonDto.tags).toEqual(["projet", "urgent"]);
    expect(arrayDto.tags).toEqual(["projet", "urgent", "finance"]);
  });

  it("ignore les tags vides et refuse les valeurs invalides", async () => {
    const emptyTagsDto = plainToInstance(UploadFileDto, {
      tags: ""
    });
    const invalidDto = plainToInstance(UploadFileDto, {
      expirationDays: "10",
      sharePassword: "short",
      tags: ["doublon", "doublon"]
    });

    await expect(validate(emptyTagsDto)).resolves.toHaveLength(0);
    expect(emptyTagsDto.tags).toBeUndefined();

    const errors = await validate(invalidDto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["expirationDays", "sharePassword", "tags"])
    );
  });

  it("applique le filtre active par defaut et valide les statuts autorises", async () => {
    const defaultDto = plainToInstance(ListFilesQueryDto, {});
    const allDto = plainToInstance(ListFilesQueryDto, { status: "all" });
    const invalidDto = plainToInstance(ListFilesQueryDto, { status: "archived" });

    await expect(validate(defaultDto)).resolves.toHaveLength(0);
    await expect(validate(allDto)).resolves.toHaveLength(0);
    await expect(validate(invalidDto)).resolves.toHaveLength(1);
    expect(defaultDto.status).toBe("active");
  });

  it("accepte un mot de passe optionnel pour le telechargement", async () => {
    const emptyDto = plainToInstance(DownloadFileDto, {});
    const protectedDto = plainToInstance(DownloadFileDto, { password: "secret1" });
    const invalidDto = plainToInstance(DownloadFileDto, { password: 123 });

    await expect(validate(emptyDto)).resolves.toHaveLength(0);
    await expect(validate(protectedDto)).resolves.toHaveLength(0);
    await expect(validate(invalidDto)).resolves.toHaveLength(1);
  });
});
