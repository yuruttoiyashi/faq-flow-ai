import {
  badRequest,
  json,
  nowIso,
  safeChoice,
  safeText,
  serverError,
  type Handler,
} from "./_shared";

const priorities = ["高", "中", "低"] as const;
const statuses = ["未対応", "対応中", "完了"] as const;

export const onRequestGet: Handler = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      `SELECT *
       FROM tickets
       ORDER BY datetime(created_at) DESC`
    ).all();

    return json({ tickets: results ?? [] });
  } catch (error) {
    return serverError(error);
  }
};

export const onRequestPost: Handler = async ({ request, env }) => {
  try {
    const body = (await request.json()) as any;

    const title = safeText(body.title);
    const content = safeText(body.content);

    if (!title || !content) {
      return badRequest("タイトルと問い合わせ内容は必須です。");
    }

    const now = nowIso();

    const ticket = {
      id: crypto.randomUUID(),
      title,
      requester: safeText(body.requester),
      category: safeText(body.category, "その他") || "その他",
      priority: safeChoice(body.priority, priorities, "中"),
      status: safeChoice(body.status, statuses, "未対応"),
      content,
      answer: safeText(body.answer),
      faq_candidate: Number(body.faq_candidate) === 1 ? 1 : 0,
      created_at: now,
      updated_at: now,
    };

    await env.DB.prepare(
      `INSERT INTO tickets
       (id, title, requester, category, priority, status, content, answer, faq_candidate, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        ticket.id,
        ticket.title,
        ticket.requester,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.content,
        ticket.answer,
        ticket.faq_candidate,
        ticket.created_at,
        ticket.updated_at
      )
      .run();

    const saved = await env.DB.prepare(`SELECT * FROM tickets WHERE id = ?`)
      .bind(ticket.id)
      .first();

    return json({ ticket: saved }, 201);
  } catch (error) {
    return serverError(error);
  }
};