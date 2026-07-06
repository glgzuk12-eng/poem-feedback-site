import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { ENV } from "./env";

import { ADMIN_COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isAdmin: boolean;
};

async function verifyAdminCookie(cookieHeader: string | undefined): Promise<boolean> {
  if (!cookieHeader) return false;
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const isAdmin = await verifyAdminCookie(opts.req.headers.cookie);

  return {
    req: opts.req,
    res: opts.res,
    user,
    isAdmin,
  };
}


