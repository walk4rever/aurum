import { cookies } from "next/headers";

export async function getLang() {
  const cookieStore = await cookies();
  return cookieStore.get("aurum.lang")?.value === "zh" ? "zh" : "en";
}
