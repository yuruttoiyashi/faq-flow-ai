import { json, logAi, runAi, serverError, type Env } from "../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { ticket } = await request.json<any>();

    const prompt = `以下の問い合わせ履歴をFAQとして再利用できる形に整えてください。

【タイトル】
${ticket?.title ?? ""}

【カテゴリ】
${ticket?.category ?? ""}

【問い合わせ内容】
${ticket?.content ?? ""}

【回答・対応メモ】
${ticket?.answer ?? ""}

出力形式:
Q.
A.
補足:
関連部署:
再発防止・問い合わせ削減のヒント:`;

    const fallback = `Q. ${ticket?.title ?? "よくある問い合わせ"}

A. まずは問い合わせ内容を確認し、必要な情報を整理したうえで担当部署に確認してください。

補足:
発生日時、対象画面、エラーメッセージ、操作手順を確認すると対応がスムーズです。

関連部署:
${ticket?.category ?? "担当部署"}

再発防止・問い合わせ削減のヒント:
同じ問い合わせが繰り返される場合は、マニュアルや社内FAQに追記してください。`;

    const result = await runAi(
      env,
      "あなたは問い合わせ履歴をFAQ化する業務改善AIです。読みやすく再利用しやすいFAQを作成します。",
      prompt,
      fallback
    );

    await logAi(env, ticket?.id ?? null, "faq", prompt, result);

    return json({ result });
  } catch (error) {
    return serverError(error);
  }
};
