import { eq, asc, desc, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, authors, works, comments } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Authors =====

export async function getAllAuthors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authors).orderBy(asc(authors.sortOrder));
}

export async function getAuthorBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAuthor(input: { name: string; slug: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(authors).values({
    name: input.name,
    slug: input.slug,
    sortOrder: input.sortOrder ?? 0,
  });
  return true;
}

// ===== Works =====

export async function getWorksByAuthorId(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(works).where(eq(works.authorId, authorId)).orderBy(asc(works.sortOrder));
}

export async function getWorkBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(works).where(eq(works.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getWorkById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(works).where(eq(works.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRecentWorks(limit: number = 8) {
  const db = await getDb();
  if (!db) return [];
  const recentWorks = await db
    .select({
      id: works.id,
      title: works.title,
      slug: works.slug,
      type: works.type,
      authorId: works.authorId,
      sortOrder: works.sortOrder,
      createdAt: works.createdAt,
    })
    .from(works)
    .orderBy(desc(works.createdAt))
    .limit(limit);

  // Get author names for these works
  if (recentWorks.length === 0) return [];
  const authorIds = Array.from(new Set(recentWorks.map(w => w.authorId)));
  const authorsArr = await db.select().from(authors).where(inArray(authors.id, authorIds));
  const authorMap = new Map(authorsArr.map(a => [a.id, a.name]));

  return recentWorks.map(w => ({
    ...w,
    authorName: authorMap.get(w.authorId) || "알 수 없음",
  }));
}

export async function getRecentWorksArchive() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: works.id,
      title: works.title,
      slug: works.slug,
      type: works.type,
      authorId: works.authorId,
      sortOrder: works.sortOrder,
      createdAt: works.createdAt,
    })
    .from(works)
    .orderBy(desc(works.createdAt));

  if (rows.length === 0) return [];

  const authorIds = Array.from(new Set(rows.map((work) => work.authorId)));
  const authorsArr = await db.select().from(authors).where(inArray(authors.id, authorIds));
  const authorMap = new Map(authorsArr.map((author) => [author.id, author.name]));
  const commentCounts = await getCommentCountsByWorkIds(rows.map((work) => work.id));

  return rows.map((work) => ({
    ...work,
    authorName: authorMap.get(work.authorId) || "알 수 없음",
    commentCount: commentCounts[work.id] || 0,
  }));
}

export async function createWork(input: {
  authorId: number;
  title: string;
  type: "poem" | "essay";
  content: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate slug from title
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100) + "-" + Date.now().toString(36);

  await db.insert(works).values({
    authorId: input.authorId,
    title: input.title,
    slug,
    type: input.type,
    content: input.content,
    sortOrder: input.sortOrder ?? 0,
  });

  return { slug };
}

export async function updateWork(id: number, input: {
  title?: string;
  type?: "poem" | "essay";
  content?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  if (Object.keys(updateData).length === 0) return;

  await db.update(works).set(updateData).where(eq(works.id, id));
}

export async function deleteWork(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete associated comments first
  await db.delete(comments).where(eq(comments.workId, id));
  await db.delete(works).where(eq(works.id, id));
}

export async function updateWorkSortOrder(workId: number, newSortOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(works).set({ sortOrder: newSortOrder }).where(eq(works.id, workId));
}

// ===== Comments =====

export async function getCommentsByWorkId(workId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments).where(eq(comments.workId, workId)).orderBy(desc(comments.createdAt));
}

export async function createComment(workId: number, nickname: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(comments).values({ workId, nickname, content });
  return true;
}

export async function getCommentCountByWorkId(workId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(comments).where(eq(comments.workId, workId));
  return result.length;
}

export async function getCommentCountsByWorkIds(workIds: number[]): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) return {};
  if (workIds.length === 0) return {};

  const result = await db
    .select({
      workId: comments.workId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(comments)
    .where(inArray(comments.workId, workIds))
    .groupBy(comments.workId);

  const counts: Record<number, number> = {};
  for (const row of result) {
    counts[row.workId] = Number(row.count);
  }
  return counts;
}
