import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Header from "./Header";

// The mobile nav (data-testid="mobile-nav") always renders the same
// flattened set of links in the DOM — hidden via a CSS class, not removed —
// alongside the desktop nav (data-testid="desktop-nav"). Every query below
// is scoped to one nav or the other so it never matches both and throws
// testing-library's "found multiple elements" error.

describe("Header", () => {
  it("renders the top-level nav links in the desktop nav", () => {
    render(<Header />);
    const desktopNav = screen.getByTestId("desktop-nav");
    expect(within(desktopNav).getByRole("link", { name: "Contact Us" })).toBeInTheDocument();
    expect(within(desktopNav).getByText("Our Solutions")).toBeInTheDocument();
  });

  it("shows the Our Solutions dropdown items when clicked", () => {
    render(<Header />);
    const desktopNav = screen.getByTestId("desktop-nav");
    fireEvent.click(within(desktopNav).getByText("Our Solutions"));
    expect(
      within(desktopNav).getByRole("link", { name: "Pre-Shipment Inspection" })
    ).toBeInTheDocument();
  });

  it("toggles the mobile menu open and closed", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId("mobile-nav")).toHaveClass("block");
    fireEvent.click(toggle);
    expect(screen.getByTestId("mobile-nav")).toHaveClass("hidden");
  });
});
