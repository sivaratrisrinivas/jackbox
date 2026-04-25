import { z } from "zod";

export interface StructuredValidationError {
  code: "validation_error";
  message: string;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
}

export function toStructuredValidationError(
  error: z.ZodError,
): StructuredValidationError {
  const flattened = z.flattenError(error);

  return {
    code: "validation_error",
    message: "Request validation failed.",
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
  };
}
