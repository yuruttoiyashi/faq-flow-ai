import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Filter,
  MessageSquareText,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

type Priority = "高" | "中" | "低";
type Status = "未対応" | "対応中" | "完了";

type Ticket = {
  id: string;
  title: string;
  requester: string;
  category: string;
  priority: Priority;
  status: Status;
  content: string;
  answer: string;
  faq_candidate: number;
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  requester: string;
  category: string;
  priority: Priority;
  status: Status;
  content: string;
  answer: string;
  faq_candidate: boolean;
};

const categories = ["システム", "勤怠", "経理", "総務", "人事", "顧客対応", "その他"];
const priorities: Priority[] = ["高", "中", "低"];
const statuses: Status[] = ["未対応", "対応中", "完了"];

const emptyForm: FormState = {
  title: "",
  requester: "",
  category: "システム",
  priority: "中",
  status: "未対応",
  content: "",
  answer: "",
  faq_candidate: false,
};

function normalizeTicket(raw: any): Ticket {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    requester: String(raw.requester ?? ""),
    category: String(raw.category ?? "その他"),
    priority: (raw.priority ?? "中") as Priority,
    status: (raw.status ?? "未対応") as Status,
    content: String(raw.content ?? ""),
    answer: String(raw.answer ?? ""),
    faq_candidate: Number(raw.faq_candidate ?? 0),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data?.error ?? "APIエラーが発生しました");
  }

  return data as T;
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"すべて" | Status>("すべて");
  const [categoryFilter, setCategoryFilter] = useState("すべて");
  const [loading, setLoading] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiOutputs, setAiOutputs] = useState<Record<string, string>>({});
  const [report, setReport] = useState("");
  const [message, setMessage] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await api<{ tickets: Ticket[] }>("/api/tickets");
      setTickets((data.tickets ?? []).map(normalizeTicket));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "未対応").length;
    const doing = tickets.filter((t) => t.status === "対応中").length;
    const done = tickets.filter((t) => t.status === "完了").length;
    const faq = tickets.filter((t) => t.faq_candidate === 1).length;
    const high = tickets.filter((t) => t.priority === "高").length;
    return { total, open, doing, done, faq, high };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const hitQuery =
        !q ||
        [ticket.title, ticket.requester, ticket.category, ticket.content, ticket.answer]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const hitStatus = statusFilter === "すべて" || ticket.status === statusFilter;
      const hitCategory = categoryFilter === "すべて" || ticket.category === categoryFilter;

      return hitQuery && hitStatus && hitCategory;
    });
  }, [tickets, query, statusFilter, categoryFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submitTicket = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("タイトルと問い合わせ内容は必須です。");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      ...form,
      faq_candidate: form.faq_candidate ? 1 : 0,
    };

    try {
      if (editingId) {
        const data = await api<{ ticket: Ticket }>(`/api/tickets/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setTickets((prev) => prev.map((t) => (t.id === editingId ? normalizeTicket(data.ticket) : t)));
        setMessage("問い合わせを更新しました。");
      } else {
        const data = await api<{ ticket: Ticket }>("/api/tickets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setTickets((prev) => [normalizeTicket(data.ticket), ...prev]);
        setMessage("問い合わせを登録しました。");
      }

      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const editTicket = (ticket: Ticket) => {
    setEditingId(ticket.id);
    setForm({
      title: ticket.title,
      requester: ticket.requester,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      content: ticket.content,
      answer: ticket.answer,
      faq_candidate: ticket.faq_candidate === 1,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("この問い合わせを削除しますか？")) return;

    setLoading(true);
    setMessage("");

    try {
      await api(`/api/tickets/${id}`, { method: "DELETE" });
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setMessage("問い合わせを削除しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const runAi = async (type: "reply" | "faq", ticket: Ticket) => {
    setAiLoadingId(`${type}-${ticket.id}`);
    setMessage("");

    try {
      const data = await api<{ result: string }>(`/api/ai/${type}`, {
        method: "POST",
        body: JSON.stringify({ ticket }),
      });

      setAiOutputs((prev) => ({
        ...prev,
        [`${type}-${ticket.id}`]: data.result,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI生成に失敗しました");
    } finally {
      setAiLoadingId(null);
    }
  };

  const generateReport = async () => {
    setAiLoadingId("report");
    setMessage("");

    try {
      const data = await api<{ result: string }>("/api/ai/report", {
        method: "POST",
        body: JSON.stringify({ tickets }),
      });

      setReport(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "レポート生成に失敗しました");
    } finally {
      setAiLoadingId(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      "タイトル",
      "問い合わせ元",
      "カテゴリ",
      "優先度",
      "ステータス",
      "FAQ候補",
      "問い合わせ内容",
      "回答内容",
      "作成日",
      "更新日",
    ];

    const rows = tickets.map((t) => [
      t.title,
      t.requester,
      t.category,
      t.priority,
      t.status,
      t.faq_candidate ? "はい" : "いいえ",
      t.content,
      t.answer,
      t.created_at,
      t.updated_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faq-flow-ai-tickets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const priorityClass = (priority: Priority) => {
    if (priority === "高") return "badge badge-high";
    if (priority === "低") return "badge badge-low";
    return "badge badge-mid";
  };

  return (
    <main className="app">
      <div className="container">
        <section className="hero">
          <div className="hero-card">
            <div className="hero-eyebrow">
              <Sparkles size={16} />
              FAQ Flow AI
            </div>
            <h1>問い合わせ対応・FAQ改善ダッシュボード</h1>
            <p>
              社内問い合わせや顧客対応を一元管理し、対応状況・FAQ化候補・改善ポイントを見える化します。
              Cloudflare Pages / Functions / D1 / Workers AI で動く、Firebase不要の業務改善アプリです。
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={loadTickets} disabled={loading}>
                <RefreshCcw size={16} />
                再読み込み
              </button>
              <button className="btn btn-dark" onClick={generateReport} disabled={aiLoadingId === "report"}>
                <Bot size={16} />
                AI改善レポート
              </button>
              <button className="btn btn-ghost" onClick={exportCsv}>
                <Download size={16} />
                CSV出力
              </button>
              <button className="btn btn-ghost" onClick={() => window.print()}>
                <Printer size={16} />
                A4印刷
              </button>
            </div>
            {message && <p className="footer-note">{message}</p>}
          </div>

          <aside className="hero-card hero-side">
            <div>
              <h2>改善できる業務課題</h2>
              <ul>
                <li>同じ問い合わせが何度も発生する</li>
                <li>対応履歴が担当者ごとに散らばる</li>
                <li>FAQ化すべき内容が見えづらい</li>
                <li>月次報告の作成に時間がかかる</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="grid grid-4">
          <StatCard title="総件数" value={stats.total} icon={<MessageSquareText size={18} />} />
          <StatCard title="未対応" value={stats.open} icon={<Filter size={18} />} />
          <StatCard title="対応中" value={stats.doing} icon={<BarChart3 size={18} />} />
          <StatCard title="完了" value={stats.done} icon={<CheckCircle2 size={18} />} />
        </section>

        <section className="grid grid-4" style={{ marginTop: 18 }}>
          <StatCard title="FAQ候補" value={stats.faq} icon={<FileText size={18} />} />
          <StatCard title="優先度 高" value={stats.high} icon={<Sparkles size={18} />} />
          <StatCard title="カテゴリ数" value={new Set(tickets.map((t) => t.category)).size} icon={<Filter size={18} />} />
          <StatCard title="表示中" value={filteredTickets.length} icon={<Search size={18} />} />
        </section>

        <section className="grid grid-main" style={{ marginTop: 18 }}>
          <div className="panel form-panel">
            <h2>{editingId ? "問い合わせを編集" : "問い合わせを登録"}</h2>

            <div className="form-grid">
              <div className="field">
                <label>タイトル</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例：勤怠システムにログインできない"
                />
              </div>

              <div className="field">
                <label>問い合わせ元</label>
                <input
                  value={form.requester}
                  onChange={(e) => setForm({ ...form, requester: e.target.value })}
                  placeholder="例：営業部 / 山田さん / 顧客A"
                />
              </div>

              <div className="form-grid two-cols">
                <div className="field">
                  <label>カテゴリ</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>優先度</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                    {priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>ステータス</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>問い合わせ内容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="問い合わせ内容を入力"
                />
              </div>

              <div className="field">
                <label>回答内容・対応メモ</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="回答内容、対応状況、補足メモ"
                />
              </div>

              <label className="badge badge-faq" style={{ width: "fit-content" }}>
                <input
                  type="checkbox"
                  checked={form.faq_candidate}
                  onChange={(e) => setForm({ ...form, faq_candidate: e.target.checked })}
                />
                FAQ候補にする
              </label>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={submitTicket} disabled={loading}>
                  <Plus size={16} />
                  {editingId ? "更新する" : "登録する"}
                </button>
                {editingId && (
                  <button className="btn btn-ghost" onClick={resetForm}>
                    編集をやめる
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>問い合わせ一覧</h2>

            <div className="toolbar">
              <div className="field search">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="キーワード検索"
                />
              </div>

              <div className="field">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "すべて" | Status)}>
                  <option>すべて</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option>すべて</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ticket-list">
              {filteredTickets.length === 0 ? (
                <div className="empty">問い合わせがまだありません。左のフォームから登録できます。</div>
              ) : (
                filteredTickets.map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <div className="ticket-head">
                      <div>
                        <h3 className="ticket-title">{ticket.title}</h3>
                        <div className="ticket-meta">
                          {ticket.requester || "問い合わせ元未入力"} / 登録: {formatDate(ticket.created_at)} / 更新:{" "}
                          {formatDate(ticket.updated_at)}
                        </div>
                      </div>
                    </div>

                    <div className="badges">
                      <span className="badge">{ticket.category}</span>
                      <span className={priorityClass(ticket.priority)}>優先度 {ticket.priority}</span>
                      <span className="badge">{ticket.status}</span>
                      {ticket.faq_candidate === 1 && <span className="badge badge-faq">FAQ候補</span>}
                    </div>

                    <div className="ticket-content">{ticket.content}</div>

                    {ticket.answer && (
                      <div className="ticket-answer">
                        <strong>回答・対応メモ</strong>
                        <br />
                        {ticket.answer}
                      </div>
                    )}

                    <div className="ticket-actions">
                      <button className="btn btn-primary" onClick={() => runAi("reply", ticket)} disabled={!!aiLoadingId}>
                        <Bot size={16} />
                        回答案AI
                      </button>
                      <button className="btn btn-dark" onClick={() => runAi("faq", ticket)} disabled={!!aiLoadingId}>
                        <FileText size={16} />
                        FAQ化AI
                      </button>
                      <button className="btn btn-ghost" onClick={() => editTicket(ticket)}>
                        <Edit3 size={16} />
                        編集
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteTicket(ticket.id)}>
                        <Trash2 size={16} />
                        削除
                      </button>
                    </div>

                    {aiOutputs[`reply-${ticket.id}`] && (
                      <div className="ai-box">
                        <h3>AI回答案</h3>
                        <div className="ai-output">{aiOutputs[`reply-${ticket.id}`]}</div>
                      </div>
                    )}

                    {aiOutputs[`faq-${ticket.id}`] && (
                      <div className="ai-box">
                        <h3>AI FAQ案</h3>
                        <div className="ai-output">{aiOutputs[`faq-${ticket.id}`]}</div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        {report && (
          <section className="report-card">
            <h2>AI改善レポート</h2>
            <div className="report-content">{report}</div>
          </section>
        )}

        <p className="footer-note">
          Demo: FAQ Flow AI / Cloudflare Pages + Functions + D1 + Workers AI
        </p>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
