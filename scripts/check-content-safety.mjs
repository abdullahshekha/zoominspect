import path from "path";
import { scanDirectoryForSpam } from "../lib/contentSafety.ts";

const targets = [
  { dir: "app", extensions: [".tsx", ".ts"] },
  { dir: "content", extensions: [".mdx"] },
  { dir: "components", extensions: [".tsx", ".ts"] },
  { dir: "lib", extensions: [".ts"] },
  { dir: "public", extensions: [".svg", ".html", ".js", ".json"] },
];

// These files intentionally contain the spam keyword/pattern definitions
// (as the detection logic) and fixtures exercising them in tests — they are
// not actual injected spam content, so they are excluded from the scan.
const EXCLUDED_FILES = new Set(
  [path.join("lib", "contentSafety.ts"), path.join("lib", "contentSafety.test.ts")]
);

let hasMatches = false;

for (const target of targets) {
  const results = scanDirectoryForSpam(target.dir, target.extensions);
  for (const result of results) {
    if (EXCLUDED_FILES.has(path.normalize(result.file))) continue;
    hasMatches = true;
    console.error(`SPAM DETECTED in ${result.file}: ${result.matches.join(", ")}`);
  }
}

if (hasMatches) {
  console.error("\nContent safety check FAILED.");
  process.exit(1);
} else {
  console.log("Content safety check passed: no spam patterns found in app/ or content/.");
  process.exit(0);
}
