import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
	it("renders nothing when isOpen=false", () => {
		render(<Modal isOpen={false} onClose={() => {}} title="Test"><p>content</p></Modal>);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders title and children when isOpen=true", () => {
		render(<Modal isOpen onClose={() => {}} title="Confirm"><p>Are you sure?</p></Modal>);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Confirm")).toBeInTheDocument();
		expect(screen.getByText("Are you sure?")).toBeInTheDocument();
	});

	it("calls onClose when × button clicked", async () => {
		const onClose = vi.fn();
		render(<Modal isOpen onClose={onClose} title="T"><p>x</p></Modal>);
		await userEvent.click(screen.getByLabelText("Close modal"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when Escape key pressed", async () => {
		const onClose = vi.fn();
		render(<Modal isOpen onClose={onClose} title="T"><p>x</p></Modal>);
		await userEvent.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when overlay is clicked", async () => {
		const onClose = vi.fn();
		render(<Modal isOpen onClose={onClose} title="T"><p>content</p></Modal>);
		// The overlay is the aria-hidden div behind the panel
		const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
		await userEvent.click(overlay);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
