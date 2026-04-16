import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class CreateChatChannelDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  isDirectMessage?: boolean;
}

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  content!: string;
}

export class ChatChannelResponseDto {
  id!: string;
  name!: string;
  description?: string;
  isDirectMessage!: boolean;
  projectId?: string;
  createdAt!: Date;
  createdBy!: string;
}

export class ChatMessageResponseDto {
  id!: string;
  content!: string;
  authorId!: string;
  author!: {
    id: string;
    fullName: string;
    email: string;
    image?: string;
  };
  channelId!: string;
  createdAt!: Date;
  isEdited!: boolean;
}
