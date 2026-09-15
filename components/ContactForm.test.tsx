import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactForm from "./ContactForm";

describe("ContactForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    ) as unknown as typeof fetch;
  });

  it("shows a validation error when required fields are empty", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  });

  it("submits to /api/contact and shows a success message", async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: "+11234567890" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "I need a quote." } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(await screen.findByText(/thanks/i)).toBeInTheDocument();
  });
});
