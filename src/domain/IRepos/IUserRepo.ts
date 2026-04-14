import { RegisterUserDto } from "../DTOs/userDTO";
import { User } from "../entities";

export interface IUserRepo {
  create(user: RegisterUserDto): any;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateEmailVerification(
    email: string,
    isEmailVerified: boolean,
  ): Promise<User>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
}
