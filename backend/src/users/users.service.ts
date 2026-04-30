import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email: this.normalizeEmail(email)
      }
    });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: this.normalizeEmail(email) })
      .getOne();
  }

  create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({
      email: this.normalizeEmail(email),
      passwordHash
    });

    return this.usersRepository.save(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
