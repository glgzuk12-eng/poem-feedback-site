import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ADMIN_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    isAdmin: false,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

describe("admin.login", () => {
  it("sets admin cookie on correct password", async () => {
    const { ctx, setCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.login({ password: "0317" });

    expect(result).toEqual({ success: true });
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
    expect(setCookies[0]?.options).toMatchObject({
      httpOnly: true,
      path: "/",
    });
    // Token should be a JWT string
    expect(setCookies[0]?.value).toMatch(/^eyJ/);
  });

  it("rejects wrong password", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.login({ password: "wrong" })).rejects.toThrow();
  });
});

describe("admin.status", () => {
  it("returns isAdmin false for unauthenticated", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.status();
    expect(result).toEqual({ isAdmin: false });
  });

  it("returns isAdmin true when context has isAdmin", async () => {
    const { ctx } = createPublicContext();
    ctx.isAdmin = true;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.status();
    expect(result).toEqual({ isAdmin: true });
  });
});

describe("admin.logout", () => {
  it("clears admin cookie", async () => {
    const { ctx, clearedCookies } = createPublicContext();
    ctx.isAdmin = true;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
  });
});

describe("admin work management access", () => {
  it("allows an authenticated admin to read the work management list", async () => {
    const { ctx } = createPublicContext();
    ctx.isAdmin = true;
    const caller = appRouter.createCaller(ctx);
    const works = await caller.admin.listAllWorks();

    expect(works).toBeInstanceOf(Array);
    expect(works.length).toBeGreaterThan(0);
    expect(works[0]).toEqual(expect.objectContaining({ title: expect.any(String), authorName: expect.any(String) }));
  });

  it("keeps work mutations protected for public visitors", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.updateWork({ id: 1, title: "권한 없음" })).rejects.toThrow();
    await expect(caller.admin.deleteWork({ id: 1 })).rejects.toThrow();
    await expect(caller.admin.updateSortOrder({ workId: 1, newSortOrder: 1 })).rejects.toThrow();
  });
});
