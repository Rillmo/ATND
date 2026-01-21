import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration is missing");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return cachedTransporter;
}

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to: params.to,
    subject: "Your verification code",
    text: `Your verification code is ${params.code}`,
    html: `<p>Your verification code is:</p><p><strong>${params.code}</strong></p>`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  code: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to: params.to,
    subject: "Reset your password",
    text: `Your password reset code is ${params.code}`,
    html: `<p>Your password reset code is:</p><p><strong>${params.code}</strong></p>`,
  });
}

export async function sendSupportEmail(params: {
  fromEmail: string;
  userId: string;
  subject: string;
  message: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const from = process.env.EMAIL_FROM;
  const to = process.env.SUPPORT_EMAIL;
  if (!from || !to) {
    throw new Error("Support email configuration is missing");
  }

  const transporter = getTransporter();
  const metaLines = [
    `User ID: ${params.userId}`,
    `From: ${params.fromEmail}`,
    params.ipAddress ? `IP: ${params.ipAddress}` : null,
    params.userAgent ? `User-Agent: ${params.userAgent}` : null,
  ].filter(Boolean);

  const text = `${metaLines.join("\n")}\n\n${params.message}`;

  await transporter.sendMail({
    from,
    to,
    replyTo: params.fromEmail,
    subject: `[ATND] ${params.subject}`,
    text,
    html: `<p>${metaLines.join("<br />")}</p><hr /><p>${params.message}</p>`,
  });
}
