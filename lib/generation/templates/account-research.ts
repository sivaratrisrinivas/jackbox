import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import { buildAccountResearchFiles } from "@/templates/account-research/files";
import {
  buildAccountResearchPreview,
  type AccountResearchPreview,
} from "@/templates/account-research/template";

export interface AccountResearchTemplateResult {
  preview: AccountResearchPreview;
  files: DemoFile[];
}

export function generateAccountResearchTemplate(
  input: ProspectInput,
  fixture: ProspectFixture,
): AccountResearchTemplateResult {
  const preview = buildAccountResearchPreview(input, fixture);

  return {
    preview,
    files: buildAccountResearchFiles(input, preview),
  };
}
