import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApi } from "@/hooks/useApi";

function Fixture({ fn }: { fn: () => Promise<string> }) {
	const { data, loading, error, refetch } = useApi(fn);

	if (loading) return <p>loading</p>;
	if (error)   return <p>error: {error}</p>;
	return (
		<>
			<p>data: {data}</p>
			<button onClick={refetch}>refetch</button>
		</>
	);
}

describe("useApi", () => {
	it("shows loading then data on success", async () => {
		const fn = vi.fn().mockResolvedValue("hello");
		render(<Fixture fn={fn} />);

		expect(screen.getByText("loading")).toBeInTheDocument();
		await waitFor(() => expect(screen.getByText("data: hello")).toBeInTheDocument());
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("shows error message on failure", async () => {
		const fn = vi.fn().mockRejectedValue({ error: "Not found", code: 404 });
		render(<Fixture fn={fn} />);

		await waitFor(() => expect(screen.getByText("error: Not found")).toBeInTheDocument());
	});

	it("shows generic error when rejection is not ApiError shape", async () => {
		const fn = vi.fn().mockRejectedValue(new Error("network"));
		render(<Fixture fn={fn} />);

		await waitFor(() =>
			expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument(),
		);
	});

	it("refetch triggers a new call to fn", async () => {
		const fn = vi.fn().mockResolvedValue("v1");
		render(<Fixture fn={fn} />);

		await waitFor(() => screen.getByText("data: v1"));

		fn.mockResolvedValue("v2");
		await userEvent.click(screen.getByText("refetch"));

		await waitFor(() => expect(screen.getByText("data: v2")).toBeInTheDocument());
		expect(fn).toHaveBeenCalledTimes(2);
	});
});
