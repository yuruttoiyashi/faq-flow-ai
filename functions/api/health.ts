import { json, type Env } from "./_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const dbOk = Boolean(env.DB);
  const aiOk = Boolean(env.AI);

  return json({
    ok: true,
    db: dbOk ? "connected" : "missing",
    ai: aiOk ? "connected" : "missing",
    message: aiOk
      ? "Cloudflare D1 and Workers AI bindings are available."
      : "D1 is available. Workers AI binding is missing or local fallback mode is active.",
  });
};
