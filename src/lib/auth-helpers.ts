"use server";

import { headers } from "next/headers";
import { getSession } from "./auth";

export async function requireUser() {
  const session = await getSession(await headers());
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if ((user as { role?: string }).role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
