/**
 * Strips script tags, formatting symbols, and restricts lengths to protect layout columns.
 */
export function sanitizeTextInput(input: string, maxLength: number): string {
  if (!input) return "";
  const systemFilterRegEx = /[<>\\/\\{}$]/g;
  return input.replace(systemFilterRegEx, "").slice(0, maxLength);
}

/**
 * Completely blocks decimals, minus signs, and text letters to keep billing records as safe integers.
 */
export function sanitizeCurrencyInput(input: string, maxLimit: number = 999999): number {
  if (!input) return 0;
  const numbersOnly = input.replace(/\D/g, "");
  return Math.min(Number(numbersOnly), maxLimit);
}
