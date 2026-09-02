/** توحيد أرقام العراق: 07xxxxxxxxx */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("964") && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("00964") && digits.length === 15) {
    return `0${digits.slice(5)}`;
  }
  if (digits.length === 10 && digits.startsWith("7")) {
    return `0${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("07")) {
    return digits;
  }

  return null;
}
