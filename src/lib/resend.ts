import { Resend } from "resend";

let resendClient: Resend | null = null;

const getResendClient = () => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  resendClient ??= new Resend(resendApiKey);

  return resendClient;
};

export const resend = {
  emails: {
    send: (...args: Parameters<Resend["emails"]["send"]>) => {
      return getResendClient().emails.send(...args);
    },
  },
};
