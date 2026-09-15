import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// blog.ts reads from a configurable directory so it can be pointed at a
// fixture directory in tests instead of the real content/blog folder.
import { getAllPostsFrom, getPostBySlugFrom } from "./blog";

describe("blog content loading", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "blog-test-"));
    writeFileSync(
      path.join(dir, "older-post.mdx"),
      `---
title: Older Post
date: 2024-01-01
excerpt: An older post.
coverImage: /images/blog/older.jpg
---

# Older Post

Body content here.
`
    );
    writeFileSync(
      path.join(dir, "newer-post.mdx"),
      `---
title: Newer Post
date: 2024-06-01
excerpt: A newer post.
coverImage: /images/blog/newer.jpg
---

# Newer Post

Body content here.
`
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns all posts sorted newest first", () => {
    const posts = getAllPostsFrom(dir);
    expect(posts.map((p) => p.slug)).toEqual(["newer-post", "older-post"]);
  });

  it("parses frontmatter fields correctly", () => {
    const posts = getAllPostsFrom(dir);
    expect(posts[0].title).toBe("Newer Post");
    expect(posts[0].excerpt).toBe("A newer post.");
    expect(posts[0].coverImage).toBe("/images/blog/newer.jpg");
  });

  it("finds a single post by slug", () => {
    const post = getPostBySlugFrom(dir, "older-post");
    expect(post?.title).toBe("Older Post");
    expect(post?.content).toContain("Body content here.");
  });

  it("returns undefined for a missing slug", () => {
    expect(getPostBySlugFrom(dir, "does-not-exist")).toBeUndefined();
  });
});
