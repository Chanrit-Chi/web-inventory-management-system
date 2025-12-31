// lib/getServerSession.ts
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";

export async function getServerSession() {
  return auth.api.getSession({
    headers: new Headers(await nextHeaders()),
  });
}
