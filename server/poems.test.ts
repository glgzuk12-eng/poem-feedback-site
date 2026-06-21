import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("authors", () => {
  it("lists all authors", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const authors = await caller.authors.list();
    expect(authors).toBeInstanceOf(Array);
    expect(authors.length).toBe(12);
    expect(authors[0]).toHaveProperty("name");
    expect(authors[0]).toHaveProperty("slug");
  });

  it("gets author by slug with works", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const author = await caller.authors.getBySlug({ slug: "kim-seungwook" });
    expect(author).not.toBeNull();
    expect(author?.name).toBe("김승욱");
    expect(author?.works).toBeInstanceOf(Array);
    expect(author?.works.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent author", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const author = await caller.authors.getBySlug({ slug: "non-existent" });
    expect(author).toBeNull();
  });
});

describe("works", () => {
  it("gets work with author info", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.works.getWithAuthor({ slug: "kim-seungwook-1-spiritus" });
    expect(result).not.toBeNull();
    expect(result?.work.title).toBe("Spiritus");
    expect(result?.author?.name).toBe("김승욱");
    expect(result?.work.content).toBeTruthy();
  });
});

describe("comments", () => {
  it("creates and lists comments", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Get a work ID first
    const work = await caller.works.getWithAuthor({ slug: "kim-seungwook-1-spiritus" });
    expect(work).not.toBeNull();
    const workId = work!.work.id;

    // Create a comment
    const result = await caller.comments.create({
      workId,
      nickname: "테스트유저",
      content: "좋은 시입니다.",
    });
    expect(result.success).toBe(true);

    // List comments
    const comments = await caller.comments.listByWork({ workId });
    expect(comments).toBeInstanceOf(Array);
    expect(comments.length).toBeGreaterThan(0);
    const found = comments.find(c => c.nickname === "테스트유저");
    expect(found).toBeTruthy();
    expect(found?.content).toBe("좋은 시입니다.");
  });

  it("rejects empty nickname", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.comments.create({
        workId: 1,
        nickname: "",
        content: "test",
      })
    ).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.comments.create({
        workId: 1,
        nickname: "test",
        content: "",
      })
    ).rejects.toThrow();
  });
});
