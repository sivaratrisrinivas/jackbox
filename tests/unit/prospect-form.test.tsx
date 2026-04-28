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

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(screen.getByText(/enter a valid public company url/i)).toBeTruthy();
    expect(screen.getByText(/pain point must be at least 10 characters/i)).toBeTruthy();
  });

  it("renders the routed success shell for valid input", async () => {
    mockGenerateRoute();
    render(<ProspectForm />);

    fireEvent.change(screen.getByLabelText(/url/i), {
      target: { value: "https://acme.example.com" },
    });
    fireEvent.change(screen.getByLabelText(/pain/i), {
      target: {
        value: "Support teams cannot answer product questions from the latest docs fast enough.",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(
      await screen.findByRole("heading", { name: /acme cloud demo room is ready/i }, { timeout: 2000 }),
    ).toBeTruthy();
    expect((await screen.findAllByText(/docs intelligence/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/credits/i)).toBeTruthy();
    expect(await screen.findByRole("button", { name: /download demo package/i })).toBeTruthy();
  });
});
