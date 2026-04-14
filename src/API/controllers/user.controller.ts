import { injectable, inject } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { UserService } from "../../app/services/user.service";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { RegisterUserDto, LoginUserDto, UserResponseDto } from "../../domain/DTOs/userDTO";
import { Token } from "../enums/token";
import { genToken } from "../utils/token";
import PostmarkSender from "../../infrastructure/email/postmarkSender";
import { UserError } from "../../app/exceptions";

@injectable()
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(RegisterUserDto, req.body);
    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }
      const user = await this.userService.register(dto);
      const token = genToken({
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      });

      const emailVerificationToken = genToken({
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        tokenType: Token.EMAIL_VERIFICATION,
      });

      const emailConfirmationURL = `http://localhost:5173/verify-email?token=${emailVerificationToken}`;
      PostmarkSender.instance.send(
        user.fullName,
        user.email,
        emailConfirmationURL,
        "email-confirmation"
      );
      res
        .status(201)
        .json({ user, token, emailVerificationToken, success: true });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(LoginUserDto, req.body);
    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const user = await this.userService.login(dto);
      const token = genToken({
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      });
      res.status(200).json({ user, token, success: true });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { userEmail } = req.body;

    try {
      const user = await this.userService.updateEmailVerification(
        userEmail,
        true
      );
      res.status(200).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }

  async forgetPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    const user = await this.userService.getByEmail(email);
    if (!user) {
      throw new UserError("User not found", 404);
    }
    const token = genToken({
      email: email,
      id: "unknown",
      isEmailVerified: false,
      tokenType: Token.RESET_PASSWORD,
    });

    try {
      const user = await this.userService.getByEmail(email);
      if (user) {
        const resetURL = `http://localhost:5173/reset-password?token=${token}`;
        PostmarkSender.instance.send(
          user.fullName,
          user.email,
          resetURL,
          "forget-password"
        );
      }
      res.status(200).json({
        success: true,
        message:
          "AN email should be sent with password recovery instruction, token is provided in response for testing.",
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { oldPassword, password } = req.body;
    const { email, tokenType } = req.user!;

    const dto = plainToInstance(LoginUserDto, {
      email: email,
      password,
    });
    try {
      if (tokenType === Token.ACCESS && !oldPassword) {
        throw new UserError(
          "Old password is required. If you forget the password, press on forget password in login page.",
          400
        );
      }

      const errors = await validate(dto);
      if (errors.length) {
        console.error(errors);
        throw new UserError(errors);
      }
      await this.userService.resetPassword(
        email,
        password,
        tokenType === Token.ACCESS ? oldPassword : null
      );
      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserByEmailOrId(req: Request, res: Response, next: NextFunction) {
    const { email, id } = req.query;

    try {
      if (!email && !id) {
        throw new UserError("Either email or id parameter is required", 400);
      }

      let user = null;
      if (email) {
        const foundUser = await this.userService.getByEmail(email as string);
        user = foundUser ? new UserResponseDto(foundUser) : null;
      } else if (id) {
        user = await this.userService.getById(id as string);
      }

      if (!user) {
        throw new UserError("User not found", 404);
      }

      res.status(200).json({ user, success: true });
    } catch (error) {
      next(error);
    }
  }
}
