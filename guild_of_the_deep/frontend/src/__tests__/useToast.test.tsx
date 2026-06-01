import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/components/ui/useToast";
import { ToastContainer } from "@/components/ui/Toast";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
}

function TriggerToast({
  message,
  type,
}: {
  message: string;
  type?: "success" | "error" | "info";
}) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>Show</button>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useToast / ToastContainer", () => {
  it("shows a toast message when showToast is called", async () => {
    // Real timers — no fake timer interaction with userEvent
    render(
      <Wrapper>
        <TriggerToast message="Hello world" type="success" />
      </Wrapper>,
    );

    await userEvent.click(screen.getByText("Show"));
    expect(screen.getByRole("alert")).toHaveTextContent("Hello world");
  });

  it("auto-dismisses after 4 seconds", () => {
    // fireEvent is synchronous — no conflict with fake timers
    vi.useFakeTimers();
    render(
      <Wrapper>
        <TriggerToast message="Bye" />
      </Wrapper>,
    );

    act(() => { fireEvent.click(screen.getByText("Show")); });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses immediately when × clicked", async () => {
    render(
      <Wrapper>
        <TriggerToast message="Remove me" />
      </Wrapper>,
    );

    await userEvent.click(screen.getByText("Show"));
    await userEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("throws when useToast is called outside ToastProvider", () => {
    function Bad() {
      useToast();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow("useToast must be used inside <ToastProvider>");
    spy.mockRestore();
  });
});
