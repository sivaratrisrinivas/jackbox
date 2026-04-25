import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import { buildDocsIntelligenceFiles } from "@/templates/docs-intelligence/files";
import {
  buildDocsIntelligencePreview,
  type DocsIntelligencePreview,
} from "@/templates/docs-intelligence/template";

export interface DocsIntelligenceTemplateResult {
  preview: DocsIntelligencePreview;
  files: DemoFile[];
}

export function generateDocsIntelligenceTemplate(
  input: ProspectInput,
  fixture: ProspectFixture,
): DocsIntelligenceTemplateResult {
  const preview = buildDocsIntelligencePreview(input, fixture);

  return {
    preview,
    files: buildDocsIntelligenceFiles(input, preview),
  };
}
