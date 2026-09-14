import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { scanTextForSpam, scanDirectoryForSpam } from "./contentSafety";

describe("scanTextForSpam", () => {
  it("returns no matches for clean English business copy", () => {
    const text = "Zoominspect offers pre-shipment inspection services in China.";
    expect(scanTextForSpam(text)).toEqual([]);
  });

  it("flags Cyrillic text", () => {
    const text = "Официальный сайт Вавада предоставляет доступ";
    expect(scanTextForSpam(text).length).toBeGreaterThan(0);
  });

  it("flags known gambling/casino keywords", () => {
    expect(scanTextForSpam("check out this casino bonus").length).toBeGreaterThan(0);
    expect(scanTextForSpam("vavada регистрация").length).toBeGreaterThan(0);
  });

  it("flags off-screen injection markup patterns", () => {
    const text = '<div style="overflow:hidden;position:absolute;left:-5312px">hidden</div>';
    expect(scanTextForSpam(text).length).toBeGreaterThan(0);
  });
});

describe("scanDirectoryForSpam", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "safety-test-"));
    writeFileSync(path.join(dir, "clean.mdx"), "# Clean post\n\nNormal content about inspections.");
    writeFileSync(path.join(dir, "dirty.mdx"), "# Post\n\nвавада казино бонус");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reports only the file containing spam", () => {
    const results = scanDirectoryForSpam(dir, [".mdx"]);
    expect(results).toHaveLength(1);
    expect(results[0].file).toContain("dirty.mdx");
  });
});
