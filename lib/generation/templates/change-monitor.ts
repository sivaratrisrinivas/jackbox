import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import { buildChangeMonitorFiles } from "@/templates/change-monitor/files";
import {
  buildChangeMonitorPreview,
  type ChangeMonitorPreview,
} from "@/templates/change-monitor/template";

export interface ChangeMonitorTemplateResult {
  preview: ChangeMonitorPreview;
  files: DemoFile[];
}

export function generateChangeMonitorTemplate(
  input: ProspectInput,
  fixture: ProspectFixture,
): ChangeMonitorTemplateResult {
  const preview = buildChangeMonitorPreview(input, fixture);

  return {
    preview,
    files: buildChangeMonitorFiles(input, preview),
  };
}
