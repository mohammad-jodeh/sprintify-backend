import { ServerClient } from "postmark";
import { MessageSendingResponse } from "postmark/dist/client/models";

class PostmarkSender {
  private postmarkClient: ServerClient;
  private static _instance: PostmarkSender = new PostmarkSender();

  private constructor() {
    this.postmarkClient = new ServerClient(
      "25d75866-f164-483e-b35f-f1c70dde109a",
    );
  }
  static get instance() {
    return PostmarkSender._instance;
  }

  async send(
    name: string,
    email: string,
    actionUrl: string,
    alias: string,
  ): Promise<MessageSendingResponse> {
    try {
      const res = await this.postmarkClient!.sendEmailWithTemplate({
        From: "120210615046@st.ahu.edu.jo",
        To: email,
        TemplateAlias: alias,
        TemplateModel: {
          name: name,
          action_url: actionUrl,
        },
      });
      return res;
    } catch (error: Error | any) {
      console.error(error, "send confirmEmail");
      return {
        ErrorCode: 500,
        Message: "string",
      } as MessageSendingResponse;
    }
  }
}

export default PostmarkSender;
