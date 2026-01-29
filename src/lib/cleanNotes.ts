export function cleanNotes(notes: string | null | undefined) {
  if (!notes) return "";

  return notes
    .replace(/^\uFEFF/, "")
    .replace(/VISITOR_META[\s\S]*?(?:\r?\n|$)/gi, "")
    .replace(/\bVISITOR_META\b\s*=?/gi, "")
    .replace(/"stage"\s*:\s*[^\n,}]+(?:,|$)/gim, "")
    .replace(/"history"\s*:\s*\[[\s\S]*?\](?:,|$)/gim, "")
    .replace(/"timestamp"\s*:\s*[^\n,}]+(?:,|$)/gim, "")
    .replace(/\{[\s\S]*?\}/g, "")
    .replace(/\[[\s\S]*?\]/g, "")
    .replace(/[{}]/g, "")
    .replace(/\[|\]/g, "")
    .replace(/"+/g, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^\s*,\s*/g, "")
    .replace(/\s*,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
