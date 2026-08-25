import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: NodePgDatabase<typeof schema> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzle(pool, { schema });
    console.log("[DATABASE] PostgreSQL Connected successfully to:", process.env.DATABASE_URL.split("@")[1] || "PostgreSQL");
  } catch (err) {
    console.error("[DATABASE] Error connecting to PostgreSQL:", err);
  }
} else {
  console.warn("[DATABASE] DATABASE_URL is not set. Running in local/in-memory mode.");
}

// Automatically create tables if they do not exist
export async function initDatabase() {
  if (!pool) return;

  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      picture TEXT,
      purpose TEXT,
      use_case TEXT DEFAULT 'personal',
      active_workspace_id TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'personal' NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member' NOT NULL,
      joined_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_join_requests (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      workspace_name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      requester_picture TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      responded_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0 NOT NULL,
      currency TEXT DEFAULT 'DOP' NOT NULL,
      color TEXT DEFAULT '#3b82f6' NOT NULL,
      icon TEXT DEFAULT 'Wallet' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT 'Tag' NOT NULL,
      color TEXT DEFAULT '#6b7280' NOT NULL,
      is_default BOOLEAN DEFAULT FALSE NOT NULL,
      parent_id TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      destination_account_id TEXT,
      date TEXT NOT NULL,
      note TEXT,
      is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
      created_by_user_id TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      category_id TEXT,
      amount_limit REAL NOT NULL,
      period TEXT DEFAULT 'monthly' NOT NULL,
      start_date TEXT NOT NULL,
      alert_threshold INTEGER DEFAULT 80 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0 NOT NULL,
      deadline TEXT NOT NULL,
      color TEXT DEFAULT '#10b981' NOT NULL,
      icon TEXT DEFAULT 'Target' NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT DEFAULT 'monthly' NOT NULL,
      next_execution_date TEXT NOT NULL,
      auto_apply BOOLEAN DEFAULT TRUE NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT DEFAULT 'general' NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open' NOT NULL,
      priority TEXT DEFAULT 'medium' NOT NULL,
      admin_reply TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      resolved_at TIMESTAMP
    );

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `;

  try {
    await pool.query(initSql);
    console.log("[DATABASE] PostgreSQL Schema & Tables initialized successfully.");
  } catch (err) {
    console.error("[DATABASE] Error initializing schema:", err);
  }
}

export * from "./schema";
