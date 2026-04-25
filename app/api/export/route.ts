import { NextResponse } from "next/server";
import { buildDemoExport } from "@/lib/generation/build-export";
import { DemoPackageSchema } from "@/lib/generation/demo-package";
import { toStructuredValidationError } from "@/lib/validation/errors";

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

  const parsedPackage = DemoPackageSchema.safeParse(body);
  if (!parsedPackage.success) {
    return NextResponse.json(toStructuredValidationError(parsedPackage.error), {
      status: 422,
    });
  }

  try {
    const { archive, filename } = buildDemoExport(parsedPackage.data);
    const responseBody = new ArrayBuffer(archive.byteLength);

    new Uint8Array(responseBody).set(archive);

    return new Response(responseBody, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: "export_failed",
        message:
          error instanceof Error
            ? error.message
            : "The demo package export could not be built.",
      },
      { status: 500 },
    );
  }
}
