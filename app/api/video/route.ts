import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import { DemoPackageSchema } from "@/lib/generation/demo-package";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";
import { buildDemoVideoProps } from "@/lib/video/demo-video-props";
import { toStructuredValidationError } from "@/lib/validation/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const logger = createPipelineLogger("video");
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

  const parsedPackage = DemoPackageSchema.safeParse(body);
  if (!parsedPackage.success) {
    logger.error("request:validation", parsedPackage.error);
    return NextResponse.json(toStructuredValidationError(parsedPackage.error), {
      status: 422,
    });
  }

  const demoPackage = parsedPackage.data;
  const inputProps = buildDemoVideoProps(demoPackage);
  logger.step("props:built", {
    companyName: inputProps.companyName,
    templateName: inputProps.templateName,
    sources: inputProps.sources.length,
  });
  const tempDir = await mkdtemp(path.join(tmpdir(), "jackbox-video-"));
  const outputLocation = path.join(tempDir, "demo.mp4");

  try {
    logger.step("bundle:start");
    const serveUrl = await bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    });
    logger.step("bundle:complete");
    logger.step("composition:select:start");
    const composition = await selectComposition({
      serveUrl,
      id: "ProspectDemo",
      inputProps,
    });
    logger.step("composition:select:complete", {
      durationInFrames: composition.durationInFrames,
      fps: composition.fps,
    });

    logger.step("render:start");
    await renderMedia({
      codec: "h264",
      composition,
      serveUrl,
      inputProps,
      outputLocation,
      chromiumOptions: {
        gl: "angle",
      },
    });
    logger.step("render:complete");

    const video = await readFile(outputLocation);
    logger.step("response:video", {
      bytes: video.byteLength,
    });
    const responseBody = new ArrayBuffer(video.byteLength);

    new Uint8Array(responseBody).set(video);

    return new Response(responseBody, {
      status: 200,
      headers: {
        "content-type": "video/mp4",
        "content-disposition": `inline; filename="jackbox-${slugify(
          inputProps.companyName,
        )}-demo-video.mp4"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    logger.error("render", error);
    return NextResponse.json(
      {
        code: "video_failed",
        message:
          error instanceof Error
            ? error.message
            : "The demo video could not be rendered.",
      },
      { status: 500 },
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
    logger.step("cleanup:complete");
  }
}
