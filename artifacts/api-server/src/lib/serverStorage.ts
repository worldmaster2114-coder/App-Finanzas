import fs from 'fs';
import path from 'path';
import os from 'os';

// Determine a reliable directory on the server disk
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'finance_db_fallback.json');

export interface ServerStorageSchema {
  users: Record<string, any>; // email -> user
  workspaces: Record<string, any>; // id -> workspace
  workspaceMembers: any[];
  accounts: Record<string, any>; // id -> account
  categories: Record<string, any>; // id -> category
  transactions: Record<string, any>; // id -> transaction
  budgets: Record<string, any>; // id -> budget
  savingsGoals: Record<string, any>; // id -> savingsGoal
  recurringTransactions: Record<string, any>; // id -> recurring
  joinRequests: any[];
}

function getEmptyStorage(): ServerStorageSchema {
  return {
    users: {},
    workspaces: {},
    workspaceMembers: [],
    accounts: {},
    categories: {},
    transactions: {},
    budgets: {},
    savingsGoals: {},
    recurringTransactions: {},
    joinRequests: [],
  };
}

export function readServerStorage(): ServerStorageSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...getEmptyStorage(), ...parsed };
    }
  } catch (err) {
    console.warn('[SERVER STORAGE] Read error, creating fresh state:', err);
  }
  return getEmptyStorage();
}

export function writeServerStorage(data: ServerStorageSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, STORAGE_FILE);
  } catch (err) {
    console.error('[SERVER STORAGE] Write error:', err);
  }
}
