import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
	it("renders children", () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
	});

	it("is disabled and shows spinner when loading=true", () => {
		render(<Button loading>Save</Button>);
		const btn = screen.getByRole("button");
		expect(btn).toBeDisabled();
		expect(screen.getByRole("status")).toBeInTheDocument(); // Spinner aria role
	});

	it("is disabled when disabled=true", () => {
		render(<Button disabled>Save</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("calls onClick when clicked", async () => {
		const handler = vi.fn();
		render(<Button onClick={handler}>Click</Button>);
		await userEvent.click(screen.getByRole("button"));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it("does not call onClick when disabled", async () => {
		const handler = vi.fn();
		render(<Button disabled onClick={handler}>Click</Button>);
		await userEvent.click(screen.getByRole("button"));
		expect(handler).not.toHaveBeenCalled();
	});

	it("applies danger variant class", () => {
		render(<Button variant="danger">Delete</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-red-600");
	});
});
