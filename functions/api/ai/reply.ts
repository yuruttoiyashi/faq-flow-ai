import { json, logAi, runAi, serverError, type Env } from "../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { ticket } = await request.json<any>();

    const prompt = `以下の問い合わせに対して、社内・顧客向けに使える丁寧で簡潔な回答案を作成してください。

【タイトル】
${ticket?.title ?? ""}

【カテゴリ】
${ticket?.category ?? ""}

【優先度】
${ticket?.priority ?? ""}

【問い合わせ内容】
${ticket?.content ?? ""}

【既存メモ】
${ticket?.answer ?? ""}

条件:
- 日本語
- 実務でそのまま使える文章
- 必要なら確認事項も箇条書き
- 断定しすぎず、丁寧に`;

    const fallback = `【AI binding 未設定時のサンプル回答案】

お問い合わせありがとうございます。
状況を確認いたしますので、以下の点をご共有ください。

1. 発生日時
2. 表示されているエラーメッセージ
3. 操作手順
4. 影響範囲

確認後、対応方針をご連絡いたします。`;

    const result = await runAi(
      env,
      "あなたは業務改善アプリに組み込まれた問い合わせ対応支援AIです。丁寧で実務的な日本語を出力します。",
      prompt,
      fallback
    );

    await logAi(env, ticket?.id ?? null, "reply", prompt, result);

    return json({ result });
  } catch (error) {
    return serverError(error);
  }
};
