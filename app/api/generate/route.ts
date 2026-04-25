import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";
import { toStructuredValidationError } from "@/lib/validation/errors";
import { ProspectInputSchema } from "@/lib/validation/prospect";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: "invalid_json",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsedInput = ProspectInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return NextResponse.json(toStructuredValidationError(parsedInput.error), {
      status: 422,
    });
  }

  try {
    const demoPackage = await generateDemoPackage(parsedInput.data);

    return NextResponse.json(demoPackage);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(toStructuredValidationError(error), { status: 422 });
    }

    return NextResponse.json(
      {
        code: "generation_failed",
        message:
          error instanceof Error
            ? error.message
            : "The demo package could not be generated.",
      },
      { status: 500 },
    );
  }
}
