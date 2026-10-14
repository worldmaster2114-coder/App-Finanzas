import fs from 'fs';
import path from 'path';
import os from 'os';

// Determine a reliable directory on the server disk
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'finance_db_fallback.json');

// Bump this value to force every client to log out and to wipe the stored user
// list once. Users are then re-collected from real Google logins only.
// Financial data (transactions, budgets, accounts...) is NOT touched.
export const SESSION_EPOCH = '2026-10-14-reset-1';

export interface ServerStorageSchema {
  usersEpoch?: string;
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
    usersEpoch: SESSION_EPOCH,
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
      const storage: ServerStorageSchema = { ...getEmptyStorage(), ...parsed };

      // One-time user reset when the epoch changes (keeps financial data)
      if (parsed.usersEpoch !== SESSION_EPOCH) {
        storage.users = {};
        storage.workspaceMembers = [];
        storage.usersEpoch = SESSION_EPOCH;
        writeServerStorage(storage);
        console.log('[SERVER STORAGE] Users reset for new session epoch:', SESSION_EPOCH);
      }

      return storage;
    }
  } catch (err) {
    console.warn('[SERVER STORAGE] Read error, creating fresh state:', err);
  }
  const initial = getEmptyStorage();
  writeServerStorage(initial);
  return initial;
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
