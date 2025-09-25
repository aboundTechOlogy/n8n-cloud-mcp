CREATE TABLE IF NOT EXISTS tool_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workflow_id TEXT,
  workflow_name TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  error_message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool_audit_user ON tool_audit(user_id);
CREATE INDEX idx_tool_audit_tool ON tool_audit(tool_name);
CREATE INDEX idx_workflow_audit_user ON workflow_audit(user_id);
