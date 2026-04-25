import { z } from "zod";

export const TemplateIdSchema = z.enum([
  "docs-intelligence",
  "change-monitor",
  "account-research",
]);

export const ProspectInputSchema = z.object({
  companyUrl: z
    .string()
    .trim()
    .url("Enter a valid public company URL."),
  painPoint: z
    .string()
    .trim()
    .min(10, "Pain point must be at least 10 characters.")
    .max(240, "Pain point must be 240 characters or less."),
});

export const RoutedDemoPlanSchema = z.object({
  templateId: TemplateIdSchema,
  reason: z.string().trim().min(1, "Routing reason is required."),
  crawlTargets: z
    .array(z.string().url("Crawl targets must be valid URLs."))
    .min(1, "At least one crawl target is required."),
});

export type TemplateId = z.infer<typeof TemplateIdSchema>;
export type ProspectInput = z.infer<typeof ProspectInputSchema>;
export type RoutedDemoPlan = z.infer<typeof RoutedDemoPlanSchema>;
