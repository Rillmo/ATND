import { getDictionary, type Locale } from "@/lib/i18n";

type ErrorContext =
  | "signup"
  | "orgCreate"
  | "orgJoin"
  | "eventCreate"
  | "checkin"
  | "leaveOrg";

export function getFriendlyErrorMessage(
  status: number,
  context: ErrorContext,
  locale: Locale
) {
  const dictionary = getDictionary(locale);
  const common = dictionary.errors.common;
  const contextErrors = dictionary.errors[context];

  const contextMatch = (contextErrors as Record<string, string | undefined>)[
    String(status)
  ];
  if (contextMatch) {
    return contextMatch;
  }

  const commonMatch = (common as Record<string, string | undefined>)[
    String(status)
  ];
  if (commonMatch) {
    return commonMatch;
  }

  return contextErrors.default ?? common[500];
}
