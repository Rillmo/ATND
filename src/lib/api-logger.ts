type LogExtras = Record<string, unknown>;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return error;
}

export function logApiError(
  context: string,
  error: unknown,
  extras: LogExtras = {}
) {
  const payload = {
    context,
    ...extras,
    error: formatError(error),
  };

  console.error("[api:error]", payload);
}
