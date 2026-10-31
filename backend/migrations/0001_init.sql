CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),last_seen TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS activity(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,type TEXT NOT NULL,language TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS activity_time ON activity(created_at);
CREATE TABLE IF NOT EXISTS subscriptions(user_id TEXT PRIMARY KEY,status TEXT NOT NULL,plan TEXT NOT NULL,paid_until TEXT NOT NULL,subscription_code TEXT);
CREATE TABLE IF NOT EXISTS checkout_intents(reference TEXT PRIMARY KEY,user_id TEXT NOT NULL,plan TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS ai_usage(user_id TEXT NOT NULL,day TEXT NOT NULL,sessions INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,day));
