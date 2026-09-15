import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

import { POST } from "./route";

function makeRequest(body: unknown, ip = "10.0.0.1", raw = false) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: raw ? (body as BodyInit) : JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMailMock.mockClear();
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.CONTACT_TO_EMAIL = "info@zoominspect.com";
  });

  it("rejects submissions with the honeypot filled in", async () => {
    const res = await POST(
      makeRequest(
        { name: "Bot", email: "bot@example.com", whatsapp: "", message: "spam", honeypot: "filled" },
        "10.0.0.2"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions missing required fields", async () => {
    const res = await POST(
      makeRequest({ name: "", email: "", whatsapp: "", message: "", honeypot: "" }, "10.0.0.3")
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions with an invalid email format", async () => {
    const res = await POST(
      makeRequest(
        { name: "Jane Doe", email: "not-an-email", whatsapp: "", message: "Hi", honeypot: "" },
        "10.0.0.4"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions where the message exceeds the length cap", async () => {
    const res = await POST(
      makeRequest(
        {
          name: "Jane Doe",
          email: "jane@example.com",
          whatsapp: "",
          message: "a".repeat(5001),
          honeypot: "",
        },
        "10.0.0.5"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects non-JSON request bodies", async () => {
    const res = await POST(makeRequest("not json", "10.0.0.6", true));
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rate limits after more than 5 requests from the same IP within a minute", async () => {
    const ip = "10.0.0.7";
    let lastRes;
    for (let i = 0; i < 6; i++) {
      lastRes = await POST(
        makeRequest(
          { name: "Jane Doe", email: "jane@example.com", whatsapp: "", message: "Hi", honeypot: "" },
          ip
        )
      );
    }
    expect(lastRes?.status).toBe(429);
  });

  it("sends an email and returns ok for a valid submission", async () => {
    const res = await POST(
      makeRequest(
        {
          name: "Jane Doe",
          email: "jane@example.com",
          whatsapp: "+11234567890",
          message: "I need a quote.",
          honeypot: "",
        },
        "10.0.0.8"
      )
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
