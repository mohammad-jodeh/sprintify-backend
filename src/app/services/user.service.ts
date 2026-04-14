import { injectable, inject } from "tsyringe";
import { IUserRepo } from "../../domain/IRepos/IUserRepo";
import bcrypt from "bcrypt";
import {
  LoginUserDto,
  RegisterUserDto,
  UserResponseDto,
} from "../../domain/DTOs/userDTO";
import { UserError } from "../exceptions";

@injectable()
export class UserService {
  constructor(@inject("IUserRepo") private userRepo: IUserRepo) {}

  async register(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.create({
      ...dto,
      password: hashedPassword,
    });
    return new UserResponseDto(user);
  }
  async login(dto: LoginUserDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    const isValid = user && (await bcrypt.compare(dto.password, user.password));

    if (!isValid) {
      throw new UserError(["Invalid email or password"], 401);
    }
    return new UserResponseDto(user);
  }

  async updateEmailVerification(email: string, isVerified: boolean = true) {
    const user = await this.userRepo.updateEmailVerification(email, isVerified);
    if (!user || !user.isEmailVerified) {
      throw new UserError(["Email verification failed"], 400);
    }
    return new UserResponseDto(user);
  }

  async resetPassword(
    email: string,
    newPassword: string,
    oldPassword?: string,
  ) {
    if (oldPassword) {
      const user = await this.userRepo.findByEmail(email);
      const isValid =
        user && (await bcrypt.compare(oldPassword, user.password));
      if (!isValid) {
        throw new UserError(["Invalid current password"], 401);
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.updatePassword(email, hashedPassword);
    return;
  }

  async getByEmail(email: string) {
    return await this.userRepo.findByEmail(email);
  }

  async getById(id: string) {
    const user = await this.userRepo.findById(id);
    return user ? new UserResponseDto(user) : null;
  }
}
