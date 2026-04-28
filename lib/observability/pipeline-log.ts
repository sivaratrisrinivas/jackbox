export interface PipelineLogger {
  id: string;
  step(step: string, details?: Record<string, unknown>): void;
  error(step: string, error: unknown, details?: Record<string, unknown>): void;
}

function isPipelineLoggingEnabled() {
  return process.env.NODE_ENV !== "test" && process.env.JACKBOX_PIPELINE_LOGS !== "0";
}

function serializeDetails(details?: Record<string, unknown>) {
  if (!details || Object.keys(details).length === 0) {
    return "";
  }

  return ` ${JSON.stringify(details)}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function createPipelineLogger(scope: string, id = crypto.randomUUID()): PipelineLogger {
  const startedAt = Date.now();

  return {
    id,
    step(step, details) {
      if (!isPipelineLoggingEnabled()) {
        return;
      }

      console.info(
        `[jackbox:${scope}:${id}] ${step} +${Date.now() - startedAt}ms${serializeDetails(
          details,
        )}`,
      );
    },
    error(step, error, details) {
      if (!isPipelineLoggingEnabled()) {
        return;
      }

      console.error(
        `[jackbox:${scope}:${id}] ${step} failed +${
          Date.now() - startedAt
        }ms ${JSON.stringify({ message: errorMessage(error), ...(details ?? {}) })}`,
      );
    },
  };
}
