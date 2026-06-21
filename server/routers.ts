import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllAuthors,
  getAuthorBySlug,
  getWorksByAuthorId,
  getWorkBySlug,
  getWorkById,
  getCommentsByWorkId,
  createComment,
} from "./db";

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
        return { ...author, works: authorWorks };
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
        // Get author info
        const allAuthors = await getAllAuthors();
        const author = allAuthors.find(a => a.id === work.authorId);
        return { work, author: author || null };
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
