import { injectable } from "tsyringe";
import { RegisterUserDto } from "../../../domain/DTOs/userDTO";
import { IUserRepo } from "../../../domain/IRepos/IUserRepo";
import { AppDataSource } from "../data-source";
import { User } from "../../../domain/entities/user.entity";
import { getDBError } from "../utils/handleDBErrors";
import { UserError } from "../../../app/exceptions";

@injectable()
export class UserRepo implements IUserRepo {
  private _userRepo;

  constructor() {
    this._userRepo = AppDataSource.getRepository(User);
  }

  async create(user: RegisterUserDto) {
    try {
      const newUser = this._userRepo.create(user);
      return await this._userRepo.save(newUser);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this._userRepo.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this._userRepo.findOneBy({ id });
  }

  async updateEmailVerification(
    email: string,
    isEmailVerified: boolean,
  ): Promise<User> {
    try {
      const affectedRows = (
        await this._userRepo.update({ email }, { isEmailVerified })
      ).affected;
      if (!affectedRows) {
        throw new UserError([`User with email ${email} not found.`], 404);
      }
      const updatedUser = await this._userRepo.findOneBy({ email });
      if (!updatedUser) {
        throw new UserError(
          [`User with email ${email} not found after update.`],
          404,
        );
      }
      return updatedUser;
    } catch (error) {
      throw getDBError(error);
    }
  }

  async updatePassword(email: string, newPassword: string): Promise<void> {
    try {
      await this._userRepo.update({ email }, { password: newPassword });
    } catch (error) {
      throw getDBError(error);
    }
  }
}
