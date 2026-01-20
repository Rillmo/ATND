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
