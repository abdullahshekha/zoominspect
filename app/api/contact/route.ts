import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — stays under typical serverless request body limits

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const rateLimitKey = forwardedFor?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const whatsapp = String(form.get("whatsapp") || "").trim();
  const wechat = String(form.get("wechat") || "").trim();
  const companyName = String(form.get("companyName") || "").trim();
  const country = String(form.get("country") || "").trim();
  const notes = String(form.get("notes") || "").trim();
  const services = form.getAll("services").map(String);
  const honeypot = String(form.get("honeypot") || "");
  const attachment = form.get("attachment");

  if (honeypot) {
    return NextResponse.json({ ok: false, error: "Rejected." }, { status: 400 });
  }

  if (!name || !email) {
    return NextResponse.json(
      { ok: false, error: "Name and email are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  if (
    name.length > 200 ||
    email.length > 200 ||
    whatsapp.length > 50 ||
    wechat.length > 50 ||
    companyName.length > 200 ||
    country.length > 100 ||
    notes.length > 5000
  ) {
    return NextResponse.json(
      { ok: false, error: "One or more fields exceed the allowed length." },
      { status: 400 }
    );
  }

  const hasAttachment = attachment instanceof File && attachment.size > 0;

  if (hasAttachment && (attachment as File).size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Attachment must be smaller than 4MB." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `WhatsApp: ${whatsapp || "-"}`,
    `WeChat ID: ${wechat || "-"}`,
    `Company Name: ${companyName || "-"}`,
    `Country: ${country || "-"}`,
    `Services Interested In: ${services.length ? services.join(", ") : "-"}`,
    "",
    "Additional Notes:",
    notes || "-",
  ];

  try {
    const mailAttachments = hasAttachment
      ? [
          {
            filename: (attachment as File).name,
            content: Buffer.from(await (attachment as File).arrayBuffer()),
          },
        ]
      : undefined;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `New enquiry from ${name} via zoominspect.com`,
      text: lines.join("\n"),
      attachments: mailAttachments,
    });
  } catch (err) {
    console.error("Failed to send contact form email:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
