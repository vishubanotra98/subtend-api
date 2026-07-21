import UserInvitation from "../emails/templates/UserInvitation.js";
import Email from "../emails/templates/VerificationEmail.js";
import { resend } from "../lib/resend.js";

export const emailVerificationService = async ({
  email,
  firstName,
  verificationToken,
}) => {
  const emailRes = await resend.emails.send({
    from: "TaskFlow <verification@taskflow.vishubanotra.xyz>",
    to: [email],
    subject: "TaskFlow Verification OTP",
    react: Email({
      firstName,
      email,
      verificationToken,
    }),
  });

  return emailRes;
};

export const emailInvitationService = async ({
  email,
  token,
  workspaceId,
  role,
}) => {
  const emailRes = await resend.emails.send({
    from: "TaskFlow <onboarding@taskflow.vishubanotra.xyz>",
    to: [email],
    subject: "Join your team on Taskflow",
    react: UserInvitation({ email, token, workspaceId, role }),
  });

  return emailRes;
};
