import { COOKIE_NAME, ADMIN_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import {
  getAllAuthors,
  getAuthorBySlug,
  getWorksByAuthorId,
  getWorkBySlug,
  getWorkById,
  getCommentsByWorkId,
  createComment,
  getRecentWorks,
  getCommentCountsByWorkIds,
  createWork,
  updateWork,
  deleteWork,
  createAuthor,
  updateWorkSortOrder,
} from "./db";

// Admin-only procedure middleware
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Admin authentication (password-based)
  admin: router({
    // Check if current session is admin
    status: publicProcedure.query(({ ctx }) => {
      return { isAdmin: ctx.isAdmin };
    }),

    // Login with password
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ENV.adminPassword) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "관리자 비밀번호가 설정되지 않았습니다." });
        }
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "비밀번호가 올바르지 않습니다." });
        }

        // Create admin JWT token
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ role: "admin" })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
          .sign(secret);

        // Set httpOnly cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),

    // Logout admin
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    // ===== Admin CRUD for works =====
    createWork: adminProcedure
      .input(z.object({
        authorId: z.number(),
        title: z.string().min(1),
        type: z.enum(["poem", "essay"]),
        content: z.string().min(1),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const work = await createWork(input);
        return work;
      }),

    updateWork: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        type: z.enum(["poem", "essay"]).optional(),
        content: z.string().min(1).optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateWork(input.id, input);
        return { success: true };
      }),

    deleteWork: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteWork(input.id);
        return { success: true };
      }),

    updateSortOrder: adminProcedure
      .input(z.object({
        workId: z.number(),
        newSortOrder: z.number(),
      }))
      .mutation(async ({ input }) => {
        await updateWorkSortOrder(input.workId, input.newSortOrder);
        return { success: true };
      }),

    createAuthor: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createAuthor(input);
        return { success: true };
      }),

    // List all works for admin management
    listAllWorks: adminProcedure.query(async () => {
      const authorsArr = await getAllAuthors();
      const allWorks: Array<{
        id: number;
        title: string;
        slug: string;
        type: string;
        authorId: number;
        authorName: string;
        sortOrder: number;
        createdAt: Date;
      }> = [];
      for (const author of authorsArr) {
        const authorWorks = await getWorksByAuthorId(author.id);
        for (const w of authorWorks) {
          allWorks.push({ ...w, authorName: author.name });
        }
      }
      return allWorks;
    }),
  }),

  // Authors
  authors: router({
    list: publicProcedure.query(async () => {
      return getAllAuthors();
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const author = await getAuthorBySlug(input.slug);
        if (!author) return null;
        const authorWorks = await getWorksByAuthorId(author.id);
        // Get comment counts for all works
        const workIds = authorWorks.map(w => w.id);
        const commentCounts = await getCommentCountsByWorkIds(workIds);
        const worksWithCounts = authorWorks.map(w => ({
          ...w,
          commentCount: commentCounts[w.id] || 0,
        }));
        return { ...author, works: worksWithCounts };
      }),
  }),

  // Works
  works: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const work = await getWorkBySlug(input.slug);
        if (!work) return null;
        return work;
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getWorkById(input.id);
      }),
    getWithAuthor: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const work = await getWorkBySlug(input.slug);
        if (!work) return null;
        const allAuthors = await getAllAuthors();
        const author = allAuthors.find(a => a.id === work.authorId);
        return { work, author: author || null };
      }),
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 8;
        return getRecentWorks(limit);
      }),
  }),

  // Comments
  comments: router({
    listByWork: publicProcedure
      .input(z.object({ workId: z.number() }))
      .query(async ({ input }) => {
        return getCommentsByWorkId(input.workId);
      }),
    create: publicProcedure
      .input(z.object({
        workId: z.number(),
        nickname: z.string().min(1).max(50),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input }) => {
        await createComment(input.workId, input.nickname, input.content);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
