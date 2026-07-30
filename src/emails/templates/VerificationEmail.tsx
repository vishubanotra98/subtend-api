import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Font,
} from "@react-email/components";

interface EmailProps {
  firstName?: string;
  verificationToken: string;
  email?: string;
}

export function Email({ firstName, verificationToken, email }: EmailProps) {
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

      <Preview>
        {firstName ? `${firstName}, ` : ""}
        your Subtend verification code is ready.
      </Preview>

      <Body style={body}>
        <Container style={container}>
          {/* Header */}

          <Section style={header}>
            <Text style={logo}>Subtend</Text>

            <Text style={headerCaption}>
              Secure verification for your account
            </Text>
          </Section>

          {/* Card */}

          <Section style={card}>
            <Section style={cardInner}>
              <Text style={eyebrow}>ACCOUNT VERIFICATION</Text>

              <Text style={heading}>
                {firstName ? `Hi ${firstName},` : "Verify your account"}
              </Text>

              <Text style={description}>
                Use the verification code below to securely complete your sign
                in. This code expires in <strong>15 minutes</strong>.
              </Text>

              {/* Verification Code */}

              <Section style={codeCard}>
                <Text style={codeLabel}>Verification code</Text>

                <Text style={code}>{verificationToken}</Text>

                <Text style={codeNote}>Never share this code with anyone.</Text>
              </Section>

              <Hr style={divider} />

              {email && (
                <>
                  <Text style={smallHeading}>Requested for</Text>

                  <Text style={accountEmail}>{email}</Text>

                  <Hr style={divider} />
                </>
              )}

              <Text style={smallHeading}>Didn't request this?</Text>

              <Text style={smallText}>
                If you didn't request this verification code, you can safely
                ignore this email. Your account remains secure.
              </Text>
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

export default Email;

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
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: 700,
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

const codeCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "28px",
  textAlign: "center",
  marginBottom: "36px",
};

const codeLabel: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
};

const code: React.CSSProperties = {
  margin: "20px 0",
  color: "#0f172a",
  fontSize: "40px",
  fontWeight: 700,
  letterSpacing: "0.30em",
  lineHeight: "48px",
};

const codeNote: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "22px",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const smallHeading: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 600,
};

const accountEmail: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#0f766e",
  fontSize: "15px",
  fontWeight: 500,
  lineHeight: "24px",
};

const smallText: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "24px",
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
