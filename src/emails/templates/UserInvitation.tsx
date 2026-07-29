import * as React from "react";
import {
  Html,
  Body,
  Preview,
  Container,
  Text,
  Hr,
  Button,
  Section,
  Head,
  Font,
  Row,
  Column,
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
          fontFamily="Geist Mono"
          fallbackFontFamily="monospace"
          webFont={{
            url: "https://fonts.gstatic.com/s/geistmono/v1/or3NQ7aH_IQn4Y4qsBRDiPMzHQ.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={body}>
        <Preview>You've been invited to join a Taskflow workspace</Preview>

        <Container style={outer}>
          <Section style={header}>
            <Row>
              <Column>
                <Text style={logoMark}>⬡</Text>
              </Column>
              <Column align="right">
                <Text style={logoText}>Taskflow</Text>
              </Column>
            </Row>
          </Section>

          {/* Card */}
          <Section style={card}>
            <div style={accentLine} />

            <Section style={cardInner}>
              <Text style={heading}>You're invited</Text>
              <Text style={subheading}>
                Someone has invited you to collaborate on{" "}
                <span style={highlight}>Taskflow</span>.
              </Text>

              <Section style={metaRow}>
                <Text style={metaItem}>
                  <span style={metaLabel}>ROLE</span>
                  <span style={metaValue}>{roleLabel}</span>
                </Text>
                <Text style={metaItem}>
                  <span style={metaLabel}>INVITED AS</span>
                  <span style={metaValue}>{email}</span>
                </Text>
              </Section>

              <Section style={btnSection}>
                <Button style={btn} href={inviteUrl}>
                  Accept Invitation →
                </Button>
              </Section>

              <Text style={expiryNote}>
                This invitation expires in{" "}
                <span style={highlight}>24 hours</span>. After that, you'll need
                to request a new one.
              </Text>

              <Hr style={divider} />

              <Text style={footerText}>
                If you weren't expecting this invite, you can safely ignore this
                email. Nothing will change on your account.
              </Text>

              <Text style={urlFallback}>
                Or copy this link: <span style={urlText}>{inviteUrl}</span>
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerCopy}>
              © {new Date().getFullYear()} Taskflow · Built for teams that ship
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default UserInvitation;

const body: React.CSSProperties = {
  backgroundColor: "#0c0c0f",
  fontFamily: "'Geist Mono', 'Courier New', monospace",
  margin: 0,
  padding: "40px 0",
};

const outer: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "0 16px",
};

const header: React.CSSProperties = {
  padding: "0 0 24px 0",
};

const logoMark: React.CSSProperties = {
  fontSize: "22px",
  color: "#5b6af0",
  margin: 0,
  lineHeight: 1,
};

const logoText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#5b5b72",
  margin: 0,
  lineHeight: "22px",
};

const card: React.CSSProperties = {
  backgroundColor: "#13131a",
  borderRadius: "12px",
  border: "1px solid #1f1f2e",
  overflow: "hidden",
};

const accentLine: React.CSSProperties = {
  height: "3px",
  background: "linear-gradient(90deg, #5b6af0 0%, #8b5cf6 50%, #06b6d4 100%)",
};

const cardInner: React.CSSProperties = {
  padding: "36px 40px 32px",
};

const iconWrapper: React.CSSProperties = {
  width: "48px",
  height: "48px",
  backgroundColor: "#1a1a2e",
  border: "1px solid #2a2a42",
  borderRadius: "10px",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginBottom: "24px",
};

const iconText: React.CSSProperties = {
  fontSize: "22px",
  margin: 0,
  lineHeight: 1,
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#f0f0f8",
  margin: "0 0 10px",
  letterSpacing: "-0.02em",
};

const subheading: React.CSSProperties = {
  fontSize: "14px",
  color: "#8888a8",
  lineHeight: "1.6",
  margin: "0 0 28px",
};

const highlight: React.CSSProperties = {
  color: "#a5b4fc",
  fontWeight: 600,
};

const metaRow: React.CSSProperties = {
  backgroundColor: "#0c0c0f",
  border: "1px solid #2a2a3e",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "28px",
};

const metaItem: React.CSSProperties = {
  fontSize: "12px",
  margin: "0 0 8px",
  color: "#8888a8",
  lineHeight: 1.4,
};

const metaLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  color: "#5b6af0",
  marginRight: "10px",
  textTransform: "uppercase" as const,
};

const metaValue: React.CSSProperties = {
  color: "#c8c8e0",
};

const btnSection: React.CSSProperties = {
  marginBottom: "24px",
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(135deg, #5b6af0 0%, #7c3aed 100%)",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textDecoration: "none",
  borderRadius: "8px",
  padding: "14px 28px",
  border: "none",
  cursor: "pointer",
};

const expiryNote: React.CSSProperties = {
  fontSize: "12px",
  color: "#55556a",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const divider: React.CSSProperties = {
  borderColor: "#1f1f2e",
  margin: "0 0 20px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#55556a",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const urlFallback: React.CSSProperties = {
  fontSize: "11px",
  color: "#44445a",
  margin: 0,
  wordBreak: "break-all" as const,
};

const urlText: React.CSSProperties = {
  color: "#4f5899",
};

const footer: React.CSSProperties = {
  padding: "20px 0 0",
  textAlign: "center" as const,
};

const footerCopy: React.CSSProperties = {
  fontSize: "11px",
  color: "#333348",
  letterSpacing: "0.06em",
  margin: 0,
};
