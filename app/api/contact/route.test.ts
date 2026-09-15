import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
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
      makeRequest({ name: "Bot", email: "bot@example.com", whatsapp: "", message: "spam", honeypot: "filled" })
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions missing required fields", async () => {
    const res = await POST(makeRequest({ name: "", email: "", whatsapp: "", message: "", honeypot: "" }));
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends an email and returns ok for a valid submission", async () => {
    const res = await POST(
      makeRequest({
        name: "Jane Doe",
        email: "jane@example.com",
        whatsapp: "+11234567890",
        message: "I need a quote.",
        honeypot: "",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
