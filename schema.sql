DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS ai_logs;

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  requester TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'その他',
  priority TEXT NOT NULL DEFAULT '中',
  status TEXT NOT NULL DEFAULT '未対応',
  content TEXT NOT NULL,
  answer TEXT DEFAULT '',
  faq_candidate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_faq_candidate ON tickets(faq_candidate);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

CREATE TABLE IF NOT EXISTS ai_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_ticket_id ON ai_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON ai_logs(type);
