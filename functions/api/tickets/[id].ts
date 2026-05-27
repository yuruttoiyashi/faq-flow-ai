import { badRequest, json, nowIso, safeChoice, safeText, serverError, type Env } from "../_shared";

const priorities = ["高", "中", "低"] as const;
const statuses = ["未対応", "対応中", "完了"] as const;

function getId(params: Record<string, string | string[]>) {
  const value = params.id;
  return Array.isArray(value) ? value[0] : value;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = getId(params);
    if (!id) return badRequest("IDがありません。");

    const body = await request.json<any>();
    const title = safeText(body.title);
    const content = safeText(body.content);

    if (!title || !content) {
      return badRequest("タイトルと問い合わせ内容は必須です。");
    }

    const updatedAt = nowIso();

    await env.DB.prepare(
      `UPDATE tickets
       SET title = ?,
           requester = ?,
           category = ?,
           priority = ?,
           status = ?,
           content = ?,
           answer = ?,
           faq_candidate = ?,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(
        title,
        safeText(body.requester),
        safeText(body.category, "その他") || "その他",
        safeChoice(body.priority, priorities, "中"),
        safeChoice(body.status, statuses, "未対応"),
        content,
        safeText(body.answer),
        Number(body.faq_candidate) === 1 ? 1 : 0,
        updatedAt,
        id
      )
      .run();

    const ticket = await env.DB.prepare(`SELECT * FROM tickets WHERE id = ?`).bind(id).first();

    if (!ticket) return json({ error: "対象の問い合わせが見つかりません。" }, 404);

    return json({ ticket });
  } catch (error) {
    return serverError(error);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const id = getId(params);
    if (!id) return badRequest("IDがありません。");

    await env.DB.prepare(`DELETE FROM tickets WHERE id = ?`).bind(id).run();

    return json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
};
