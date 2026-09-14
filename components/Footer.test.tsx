import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("shows the contact email and WhatsApp number", () => {
    render(<Footer />);
    expect(screen.getByText("info@zoominspect.com")).toBeInTheDocument();
    expect(screen.getByText("+86 156 6700 2048")).toBeInTheDocument();
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
