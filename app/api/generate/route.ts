import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";
import { toStructuredValidationError } from "@/lib/validation/errors";
import { ProspectInputSchema } from "@/lib/validation/prospect";

const GENERATION_TIMEOUT_MS = Number(process.env.JACKBOX_GENERATION_TIMEOUT_MS ?? 55_000);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Generation timed out after ${timeoutMs}ms. Firecrawl or Gemini did not return quickly enough.`,
          ),
        );
      }, timeoutMs);
    }),
  ]);
}

export async function POST(request: Request) {
  const logger = createPipelineLogger("generate");
  let body: unknown;

  try {
    logger.step("request:read");
    body = await request.json();
  } catch {
    logger.error("request:json", new Error("Request body must be valid JSON."));
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
    logger.error("request:validation", parsedInput.error);
    return NextResponse.json(toStructuredValidationError(parsedInput.error), {
      status: 422,
    });
  }

  try {
    logger.step("request:validated", {
      host: new URL(parsedInput.data.companyUrl).hostname,
      painLength: parsedInput.data.painPoint.length,
    });
    const demoPackage = await withTimeout(
      generateDemoPackage(parsedInput.data),
      GENERATION_TIMEOUT_MS,
    );
    logger.step("response:success", {
      templateId: demoPackage.templateId,
      sourceCount: demoPackage.provenance.length,
      dataSource: demoPackage.preview.dataSource,
    });

    return NextResponse.json(demoPackage);
  } catch (error) {
    logger.error("response:generation", error);
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
