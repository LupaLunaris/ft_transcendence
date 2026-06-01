import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders label above the input", () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("shows error message in red when error prop set", () => {
    render(<Input label="Email" value="" onChange={() => {}} error="Invalid email" />);
    const errorEl = screen.getByRole("alert");
    expect(errorEl).toHaveTextContent("Invalid email");
  });

  it("does not render error element when no error", () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const handler = vi.fn();
    render(<Input label="Name" value="" onChange={handler} />);
    await userEvent.type(screen.getByLabelText("Name"), "hi");
    expect(handler).toHaveBeenCalled();
  });
});
