// @vitest-environment node
//
// This test exercises a server-side Route Handler using the native
// Request/FormData/File (undici) APIs. The project's default Vitest
// environment is jsdom (for component tests), but jsdom's File/FormData
// classes are not interchangeable with undici's — constructing a File
// under jsdom and appending it to an undici FormData fails cross-realm
// validation. Running this file in the plain "node" environment avoids
// that mismatch entirely.
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test" });

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

import { POST } from "./route";

function makeFormRequest(fields: Record<string, string | Blob>, ip = "10.0.0.1") {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  });
}

function makeRawRequest(body: BodyInit, ip = "10.0.0.1") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body,
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
      makeFormRequest(
        { name: "Bot", email: "bot@example.com", honeypot: "filled" },
        "10.0.0.2"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions missing required fields", async () => {
    const res = await POST(makeFormRequest({ name: "", email: "" }, "10.0.0.3"));
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions with an invalid email format", async () => {
    const res = await POST(
      makeFormRequest({ name: "Jane Doe", email: "not-an-email" }, "10.0.0.4")
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects submissions where a field exceeds its length cap", async () => {
    const res = await POST(
      makeFormRequest(
        { name: "Jane Doe", email: "jane@example.com", notes: "a".repeat(5001) },
        "10.0.0.5"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects malformed (non-multipart) request bodies", async () => {
    const res = await POST(makeRawRequest("not a form body", "10.0.0.6"));
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects an attachment larger than 4MB", async () => {
    const bigFile = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });
    const res = await POST(
      makeFormRequest(
        { name: "Jane Doe", email: "jane@example.com", attachment: bigFile },
        "10.0.0.9"
      )
    );
    expect(res.status).toBe(400);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rate limits after more than 5 requests from the same IP within a minute", async () => {
    const ip = "10.0.0.7";
    let lastRes;
    for (let i = 0; i < 6; i++) {
      lastRes = await POST(
        makeFormRequest({ name: "Jane Doe", email: "jane@example.com" }, ip)
      );
    }
    expect(lastRes?.status).toBe(429);
  });

  it("sends an email with all fields and returns ok for a valid submission", async () => {
    const res = await POST(
      makeFormRequest(
        {
          name: "Jane Doe",
          email: "jane@example.com",
          whatsapp: "+11234567890",
          wechat: "janedoe_wc",
          companyName: "Acme Inc.",
          country: "United States",
          services: "Pre-Shipment Inspection",
          notes: "I need a quote.",
        },
        "10.0.0.8"
      )
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.text).toContain("Acme Inc.");
    expect(mailArgs.text).toContain("Pre-Shipment Inspection");
    expect(mailArgs.attachments).toBeUndefined();
  });

  it("attaches an uploaded file to the outgoing email", async () => {
    const file = new File(["file contents"], "spec.pdf", { type: "application/pdf" });
    const res = await POST(
      makeFormRequest(
        { name: "Jane Doe", email: "jane@example.com", attachment: file },
        "10.0.0.10"
      )
    );
    expect(res.status).toBe(200);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.attachments).toHaveLength(1);
    expect(mailArgs.attachments[0].filename).toBe("spec.pdf");
  });
});
