import { z } from "zod";
import {
  ProspectInputSchema,
  RoutedDemoPlanSchema,
  TemplateIdSchema,
} from "@/lib/validation/prospect";

export const DemoSourceSchema = z.object({
  label: z.string().trim().min(1, "Source label is required."),
  url: z.string().url("Source URL must be valid."),
  excerpt: z.string().trim().min(1).optional(),
});

export const CreditEstimateLineItemSchema = z.object({
  label: z.string().trim().min(1, "Estimate label is required."),
  credits: z.number().int().nonnegative(),
});

export const CreditEstimateSchema = z.object({
  totalCredits: z.number().int().nonnegative(),
  rationale: z.string().trim().min(1, "Credit estimate rationale is required."),
  breakdown: z
    .array(CreditEstimateLineItemSchema)
    .min(1, "At least one credit estimate line item is required."),
});

export const DemoFileSchema = z.object({
  path: z.string().trim().min(1, "Generated file path is required."),
  description: z.string().trim().min(1, "Generated file description is required."),
  mediaType: z.string().trim().min(1).optional(),
  content: z.string().optional(),
});

export const DemoPackageSchema = z.object({
  id: z.string().trim().min(1, "Demo package id is required."),
  templateId: TemplateIdSchema,
  createdAt: z.string().datetime({ offset: true }),
  input: ProspectInputSchema,
  routedPlan: RoutedDemoPlanSchema,
  summary: z.object({
    headline: z.string().trim().min(1, "Summary headline is required."),
    whyThisMatters: z
      .string()
      .trim()
      .min(1, "Why this matters copy is required."),
    architectureNote: z
      .string()
      .trim()
      .min(1, "Architecture note is required."),
  }),
  preview: z.record(z.string(), z.unknown()),
  provenance: z
    .array(DemoSourceSchema)
    .min(1, "At least one provenance source is required."),
  creditEstimate: CreditEstimateSchema,
  files: z.array(DemoFileSchema),
});

export type DemoPackage = z.infer<typeof DemoPackageSchema>;
export type CreditEstimate = z.infer<typeof CreditEstimateSchema>;
export type DemoSource = z.infer<typeof DemoSourceSchema>;
export type DemoFile = z.infer<typeof DemoFileSchema>;
