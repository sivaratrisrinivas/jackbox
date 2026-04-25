import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProspectForm } from "@/components/prospect-form";

afterEach(() => {
  cleanup();
});

describe("ProspectForm", () => {
  it("shows inline validation messages for invalid input", async () => {
    render(<ProspectForm />);

    fireEvent.click(screen.getByRole("button", { name: /generate routed preview/i }));

    expect(screen.getByText(/enter a valid public company url/i)).toBeTruthy();
    expect(screen.getByText(/pain point must be at least 10 characters/i)).toBeTruthy();
  });

  it("renders the routed success shell for valid input", async () => {
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
      await screen.findByText(/routed preview ready/i, undefined, { timeout: 2000 }),
    ).toBeTruthy();
    expect(
      await screen.findByText(/Acme is ready for a tailored Firecrawl walkthrough/i),
    ).toBeTruthy();
    expect(await screen.findAllByText(/docs intelligence/i)).toHaveLength(2);
    expect(await screen.findAllByText(/credit estimate/i)).toHaveLength(2);
  });

  it("renders the fallback error shell when the error path is requested", async () => {
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
      await screen.findByText(/the preview hit a deliberate failure path/i, undefined, {
        timeout: 2000,
      }),
    ).toBeTruthy();
    expect(
      await screen.findByText(/keep fallback copy readable before the server orchestration route exists/i),
    ).toBeTruthy();
  });
});
