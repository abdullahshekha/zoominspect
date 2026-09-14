import { scanDirectoryForSpam } from "../lib/contentSafety.ts";

const targets = [
  { dir: "app", extensions: [".tsx", ".ts"] },
  { dir: "content", extensions: [".mdx"] },
];

let hasMatches = false;

for (const target of targets) {
  const results = scanDirectoryForSpam(target.dir, target.extensions);
  for (const result of results) {
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
