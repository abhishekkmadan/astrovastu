/**
 * Build a Content-Disposition attachment header that stays valid under the
 * Fetch Headers ByteString rules (code points ≤ 255, no CR/LF).
 *
 * Non-ASCII basenames (common for AstroVastu project names) must not be placed
 * raw in `filename="..."` — that throws when constructing the response.
 * Use an ASCII fallback plus RFC 5987 `filename*` for the real UTF-8 name.
 */
export function attachmentContentDisposition(
  rawBaseName: string,
  suffix = "-vastu-report.pdf"
): string {
  const base = (rawBaseName ?? "").trim() || "report";
  const full = `${base}${suffix}`;

  const ascii =
    full
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\]/g, "_")
      .replace(/[/\\:?*<>|]+/g, "_")
      .replace(/\s+/g, " ")
      .trim() || "report-vastu-report.pdf";

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(full)}`;
}
