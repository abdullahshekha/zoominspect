import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import path from "path";

// Signature patterns of the SEO-spam injection found on the hacked
// zoominspect.com site: Cyrillic script, gambling/casino keywords in
// several languages, and the off-screen CSS injection technique used
// to hide the spam from visitors while still being crawled.
const CYRILLIC_PATTERN = /[Ѐ-ӿ]{3,}/;

const BANNED_KEYWORDS = [
  "casino",
  "vavada",
  "spinrise",
  "mostbet",
  "1xbet",
  "rabona",
  "sgcasino",
  "buran casino",
  "jackpotpiraten",
  "казино",
  "ставк",
  "букмекер",
  "spela casino",
  "bankid",
];

const INJECTION_MARKUP_PATTERN =
  /overflow\s*:\s*hidden[^>]*position\s*:\s*absolute|position\s*:\s*absolute[^>]*overflow\s*:\s*hidden/i;

export function scanTextForSpam(text: string): string[] {
  const matches: string[] = [];

  if (CYRILLIC_PATTERN.test(text)) {
    matches.push("cyrillic-script");
  }

  const lower = text.toLowerCase();
  for (const keyword of BANNED_KEYWORDS) {
    if (lower.includes(keyword)) {
      matches.push(`keyword:${keyword}`);
    }
  }

  if (INJECTION_MARKUP_PATTERN.test(text)) {
    matches.push("offscreen-injection-markup");
  }

  return matches;
}

export function scanDirectoryForSpam(
  dir: string,
  extensions: string[]
): { file: string; matches: string[] }[] {
  const results: { file: string; matches: string[] }[] = [];

  if (!existsSync(dir)) {
    return results;
  }

  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      const fullPath = path.join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => fullPath.endsWith(ext))) {
        const text = readFileSync(fullPath, "utf-8");
        const matches = scanTextForSpam(text);
        if (matches.length > 0) {
          results.push({ file: fullPath, matches });
        }
      }
    }
  }

  walk(dir);
  return results;
}
