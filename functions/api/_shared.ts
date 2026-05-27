export type Env = {
  DB: any;
  AI?: {
    run: (model: string, input: unknown) => Promise<any>;
  };
};

export type FunctionContext = {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
};

export type Handler = (context: FunctionContext) => Response | Promise<Response>;

export const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function badRequest(message: string) {
  return json({ error: message }, 400);
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error";
  return json({ error: message }, 500);
}

export function nowIso() {
  return new Date().toISOString();
}

export function safeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

export function safeChoice<T extends string>(
  value: unknown,
  choices: readonly T[],
  fallback: T
): T {
  if (typeof value === "string" && (choices as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export async function runAi(
  env: Env,
  system: string,
  user: string,
  fallback: string
) {
  if (!env.AI) {
    return fallback;
  }

  const response = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    max_tokens: 900,
  });

  if (typeof response?.response === "string") return response.response;
  if (typeof response?.result === "string") return response.result;
  if (typeof response === "string") return response;

  return JSON.stringify(response, null, 2);
}

export async function logAi(
  env: Env,
  ticketId: string | null,
  type: string,
  prompt: string,
  result: string
) {
  await env.DB.prepare(
    `INSERT INTO ai_logs (id, ticket_id, type, prompt, result, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), ticketId, type, prompt, result, nowIso())
    .run();
}