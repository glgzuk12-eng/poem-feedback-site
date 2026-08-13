import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    isAdmin: false,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("recent works archive", () => {
  it("returns all works newest first with author and feedback metadata", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const works = await caller.works.recentArchive();

    expect(works.length).toBeGreaterThan(0);
    expect(works[0]).toEqual(expect.objectContaining({
      title: expect.any(String),
      slug: expect.any(String),
      authorName: expect.any(String),
      commentCount: expect.any(Number),
    }));

    for (let index = 1; index < works.length; index += 1) {
      expect(new Date(works[index - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(works[index].createdAt).getTime(),
      );
    }
  });
});
