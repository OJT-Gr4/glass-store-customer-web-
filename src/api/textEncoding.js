// Repair legacy UTF-8 text that was previously decoded as Latin-1/Windows-1252.
// Leave ordinary Unicode and malformed byte sequences untouched.
const windows1252 = new Map(Array.from(new TextDecoder('windows-1252').decode(
  Uint8Array.from({ length: 32 }, (_, i) => i + 128)
), (character, index) => [character, index + 128]));
const decoder = new TextDecoder('utf-8', { fatal: true });

export function repairVietnamese(value) {
  if (typeof value !== 'string' || !/[ÃÂÄá][\x80-\xBF\u0080-\u009f\u2018-\u203a\u20ac\u2122]/.test(value)) return value;
  try {
    const bytes = Array.from(value, character => {
      const code = character.codePointAt(0);
      if (code <= 255) return code;
      if (windows1252.has(character)) return windows1252.get(character);
      throw new Error('Not a Latin-1 sequence');
    });
    return decoder.decode(Uint8Array.from(bytes));
  } catch {
    return value;
  }
}

const displayFields = new Set(['name', 'fullName', 'customerName', 'productName', 'variantName', 'description', 'brandName', 'address', 'notes']);
export function repairDisplayText(value) {
  if (Array.isArray(value)) return value.map(repairDisplayText);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, typeof item === 'string' && displayFields.has(key) ? repairVietnamese(item) : repairDisplayText(item),
  ]));
}
