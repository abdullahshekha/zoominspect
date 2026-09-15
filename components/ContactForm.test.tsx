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

  it("renders all fields matching the old site's form", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wechat id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file upload/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Pre-Shipment Inspection" })).toBeInTheDocument();
  });

  it("submits a FormData body to /api/contact and shows a success message", async () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), { target: { value: "+11234567890" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Pre-Shipment Inspection" }));
    fireEvent.change(screen.getByLabelText(/additional notes/i), { target: { value: "I need a quote." } });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({ method: "POST" })
      );
    });

    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = call[1].body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("name")).toBe("Jane Doe");
    expect(body.get("email")).toBe("jane@example.com");
    expect(body.getAll("services")).toEqual(["Pre-Shipment Inspection"]);

    expect(await screen.findByText(/thanks/i)).toBeInTheDocument();
  });
});
