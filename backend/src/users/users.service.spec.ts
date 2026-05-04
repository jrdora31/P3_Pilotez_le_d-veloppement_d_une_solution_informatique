import { Repository } from "typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<Pick<Repository<User>, "findOne" | "createQueryBuilder" | "create" | "save">>;

  const user: User = {
    id: "8f16a8a8-6046-43a2-85cc-dc639f6b7738",
    email: "claire.marie@datashare.fr",
    passwordHash: "$2a$12$placeholder",
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-01T10:00:00.000Z")
  };

  beforeEach(() => {
    usersRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn()
    };

    usersService = new UsersService(usersRepository as unknown as Repository<User>);
  });

  it("cherche un utilisateur par email normalise", async () => {
    usersRepository.findOne.mockResolvedValue(user);

    await expect(usersService.findByEmail(" Claire.Marie@DataShare.FR ")).resolves.toEqual(user);
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: {
        email: "claire.marie@datashare.fr"
      }
    });
  });

  it("charge explicitement le hash de mot de passe pour l'authentification", async () => {
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user)
    };
    usersRepository.createQueryBuilder.mockReturnValue(queryBuilder as never);

    await expect(usersService.findByEmailWithPassword(" Claire.Marie@DataShare.FR ")).resolves.toEqual(user);
    expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith("user");
    expect(queryBuilder.addSelect).toHaveBeenCalledWith("user.passwordHash");
    expect(queryBuilder.where).toHaveBeenCalledWith("user.email = :email", {
      email: "claire.marie@datashare.fr"
    });
  });

  it("cree un utilisateur avec un email normalise", async () => {
    const createdUser = {
      email: "claire.marie@datashare.fr",
      passwordHash: "$2a$12$placeholder"
    } as User;
    usersRepository.create.mockReturnValue(createdUser);
    usersRepository.save.mockResolvedValue(user);

    await expect(usersService.create(" Claire.Marie@DataShare.FR ", "$2a$12$placeholder")).resolves.toEqual(user);
    expect(usersRepository.create).toHaveBeenCalledWith({
      email: "claire.marie@datashare.fr",
      passwordHash: "$2a$12$placeholder"
    });
    expect(usersRepository.save).toHaveBeenCalledWith(createdUser);
  });
});
