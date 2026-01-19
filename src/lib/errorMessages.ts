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

  if (contextErrors[status as keyof typeof contextErrors]) {
    return contextErrors[status as keyof typeof contextErrors] as string;
  }

  if (common[status as keyof typeof common]) {
    return common[status as keyof typeof common] as string;
  }

  return contextErrors.default ?? common[500];
}
