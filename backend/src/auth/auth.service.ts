import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { PublicUser, toPublicUser } from "../users/public-user.type";
import { User } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { AuthResponse } from "./auth-response.type";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./jwt-payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<PublicUser> {
    this.assertPasswordPolicy(registerDto.password);

    if (registerDto.password !== registerDto.passwordConfirmation) {
      throw new BadRequestException("Les mots de passe ne correspondent pas.");
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException("Cette adresse email est deja utilisee.");
    }

    const passwordHash = await hash(registerDto.password, 12);
    const user = await this.usersService.create(registerDto.email, passwordHash);

    return toPublicUser(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    if (!user || !(await this.isPasswordValid(loginDto.password, user))) {
      throw new UnauthorizedException("Identifiants invalides.");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: toPublicUser(user)
    };
  }

  private assertPasswordPolicy(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException("Le mot de passe doit contenir au moins 8 caracteres.");
    }
  }

  private isPasswordValid(password: string, user: User): Promise<boolean> {
    return compare(password, user.passwordHash);
  }
}
