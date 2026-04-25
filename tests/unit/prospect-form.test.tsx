import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/generate/route";
import { ProspectForm } from "@/components/prospect-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockGenerateRoute() {
  vi.stubGlobal(
    "fetch",
    vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      POST(
        new Request("http://localhost/api/generate", {
          method: init?.method,
          headers: init?.headers,
          body: init?.body,
        }),
      ),
    ),
  );
}

describe("ProspectForm", () => {
  it("shows inline validation messages for invalid input", async () => {
    render(<ProspectForm />);

    fireEvent.click(screen.getByRole("button", { name: /generate routed preview/i }));

    expect(screen.getByText(/enter a valid public company url/i)).toBeTruthy();
    expect(screen.getByText(/pain point must be at least 10 characters/i)).toBeTruthy();
  });

  it("renders the routed success shell for valid input", async () => {
    mockGenerateRoute();
    render(<ProspectForm />);

    fireEvent.change(screen.getByLabelText(/company url/i), {
      target: { value: "https://acme.example.com" },
    });
    fireEvent.change(screen.getByLabelText(/buyer pain point/i), {
      target: {
        value: "Support teams cannot answer product questions from the latest docs fast enough.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /generate routed preview/i }));

    expect(await screen.findByText(/routing the founder brief/i)).toBeTruthy();
    expect(
      await screen.findByText(/demo package ready/i, undefined, { timeout: 2000 }),
    ).toBeTruthy();
    expect(
      await screen.findByText(/Acme Cloud is ready for a tailored Firecrawl walkthrough/i),
    ).toBeTruthy();
    expect((await screen.findAllByText(/docs intelligence/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/credit estimate/i)).toBeTruthy();
  });

  it("renders the fallback error shell when the error path is requested", async () => {
    mockGenerateRoute();
    render(<ProspectForm />);

    fireEvent.change(screen.getByLabelText(/company url/i), {
      target: { value: "https://acme.example.com" },
    });
    fireEvent.change(screen.getByLabelText(/buyer pain point/i), {
      target: {
        value: "Support teams cannot answer product questions from the latest docs fast enough.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /preview fallback state/i }));

    expect(await screen.findByText(/routing the founder brief/i)).toBeTruthy();
    expect(
      await screen.findByText(/the route returned a structured error/i, undefined, {
        timeout: 2000,
      }),
    ).toBeTruthy();
    expect(
      await screen.findByText(/request validation failed/i),
    ).toBeTruthy();
  });
});
