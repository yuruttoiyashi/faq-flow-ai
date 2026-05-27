import { json, logAi, runAi, serverError, type Env } from "../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { tickets } = await request.json<any>();
    const list = Array.isArray(tickets) ? tickets : [];

    const summary = list
      .slice(0, 80)
      .map((t, i) => {
        return `${i + 1}. [${t.status} / ${t.priority} / ${t.category}] ${t.title}
問い合わせ: ${String(t.content ?? "").slice(0, 180)}
回答: ${String(t.answer ?? "").slice(0, 180)}
FAQ候補: ${Number(t.faq_candidate) === 1 ? "はい" : "いいえ"}`;
      })
      .join("\n\n");

    const prompt = `以下の問い合わせ一覧をもとに、業務改善レポートを作成してください。

${summary || "問い合わせデータはまだありません。"}

出力項目:
1. 全体の状況
2. 多い問い合わせカテゴリ
3. 優先的に対応すべき課題
4. FAQ化した方がよい内容
5. 問い合わせ削減の改善案
6. 次月のアクション`;

    const fallback = `1. 全体の状況
問い合わせデータを蓄積することで、未対応件数・対応中件数・FAQ候補を確認できます。

2. 多い問い合わせカテゴリ
カテゴリ別に件数を確認し、件数が多い領域からFAQ化を進めると効果的です。

3. 優先的に対応すべき課題
優先度「高」かつ未対応の問い合わせを最初に確認してください。

4. FAQ化した方がよい内容
同じ内容が繰り返される問い合わせ、説明が長くなりやすい問い合わせはFAQ候補です。

5. 問い合わせ削減の改善案
FAQ、マニュアル、回答テンプレートを整備し、問い合わせ前に自己解決できる導線を作ります。

6. 次月のアクション
FAQ候補を3件選び、回答文を整えて社内共有することから始めます。`;

    const result = await runAi(
      env,
      "あなたは問い合わせ対応の業務改善レポートを作成するAIです。採用担当にも伝わる実務的な日本語で出力します。",
      prompt,
      fallback
    );

    await logAi(env, null, "report", prompt, result);

    return json({ result });
  } catch (error) {
    return serverError(error);
  }
};
