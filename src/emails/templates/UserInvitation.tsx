import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Font,
} from "@react-email/components";
import { BASE_URL_CLIENT } from "../../constants/constant.js";

interface InviteProps {
  email: string;
  token: string;
  workspaceId: string;
  role: string;
  exists: boolean;
}

export function UserInvitation({
  email,
  token,
  workspaceId,
  role,
  exists,
}: InviteProps) {
  const inviteUrl = `${BASE_URL_CLIENT}/user-invite?utok=${token}&email=${email}&wid=${workspaceId}&role=${role}&exists=${exists}`;

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    : "Member";

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTcviYwY.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>You've been invited to join a Subtend workspace.</Preview>

      <Body style={body}>
        <Container style={container}>
          {/* Header */}

          <Section style={header}>
            <Text style={logo}>Subtend</Text>

            <Text style={headerCaption}>
              Modern collaboration for engineering teams
            </Text>
          </Section>

          {/* Card */}

          <Section style={card}>
            <Section style={cardInner}>
              <Text style={eyebrow}>WORKSPACE INVITATION</Text>

              <Text style={heading}>You're invited to collaborate.</Text>

              <Text style={description}>
                You've been invited to join a workspace on{" "}
                <strong>Subtend</strong>. Accept the invitation below to access
                your workspace and start collaborating with your team.
              </Text>

              {/* Information */}

              <Section style={infoCard}>
                <Section style={infoBlock}>
                  <Text style={label}>Role</Text>

                  <Text style={value}>{roleLabel}</Text>
                </Section>

                <Hr style={infoDivider} />

                <Section style={infoBlock}>
                  <Text style={label}>Invited email</Text>

                  <Text style={value}>{email}</Text>
                </Section>
              </Section>

              {/* CTA */}

              <Section style={buttonContainer}>
                <Button href={inviteUrl} style={button}>
                  Accept invitation
                </Button>
              </Section>

              <Text style={expiry}>
                This invitation will expire in <strong>24 hours</strong>. If it
                expires, you'll need to request another invitation from your
                workspace administrator.
              </Text>

              <Hr style={divider} />

              <Text style={smallHeading}>Didn't expect this email?</Text>

              <Text style={smallText}>
                If you weren't expecting this invitation, you can safely ignore
                this email. No changes will be made to your account unless you
                accept the invitation.
              </Text>

              <Text style={copyText}>
                If the button above doesn't work, copy and paste this URL into
                your browser:
              </Text>

              <Section style={linkBox}>
                <Text style={link}>{inviteUrl}</Text>
              </Section>
            </Section>
          </Section>

          {/* Footer */}

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Subtend. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default UserInvitation;

const body: React.CSSProperties = {
  margin: 0,
  padding: "48px 0",
  backgroundColor: "#f8fafc",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0 24px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "32px",
};

const logo: React.CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.04em",
};

const headerCaption: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
};

const cardInner: React.CSSProperties = {
  padding: "48px",
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  marginBottom: "18px",
  color: "#0f766e",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "34px",
  fontWeight: 700,
  lineHeight: "42px",
  letterSpacing: "-0.03em",
};

const description: React.CSSProperties = {
  margin: "18px 0 36px",
  color: "#475569",
  fontSize: "16px",
  lineHeight: "28px",
};

const infoCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "36px",
};

const infoBlock: React.CSSProperties = {
  margin: 0,
};

const label: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 600,
};

const value: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 500,
  lineHeight: "24px",
};

const infoDivider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "30px",
};

const button: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#0f766e",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 34px",
  borderRadius: "10px",
};

const expiry: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "24px",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "36px 0",
};

const smallHeading: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: 600,
};

const smallText: React.CSSProperties = {
  margin: "12px 0 24px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "24px",
};

const copyText: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "22px",
};

const linkBox: React.CSSProperties = {
  marginTop: "14px",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "16px",
};

const link: React.CSSProperties = {
  margin: 0,
  color: "#0f766e",
  fontSize: "12px",
  lineHeight: "20px",
  wordBreak: "break-all",
};

const footer: React.CSSProperties = {
  textAlign: "center",
  paddingTop: "28px",
};

const footerText: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "20px",
};
