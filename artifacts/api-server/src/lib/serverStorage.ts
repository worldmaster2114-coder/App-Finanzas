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
  const seedUsers: Record<string, any> = {
    "worldmaster2114@gmail.com": {
      id: "usr-daniel-master",
      email: "worldmaster2114@gmail.com",
      name: "Daniel Gerardo",
      role: "super_admin",
      purpose: "controlar",
      useCase: "shared",
      activeWorkspaceId: "ws-default",
      createdAt: new Date().toISOString(),
    },
    "arianna@grupowalnut.com": {
      id: "usr-arianna",
      email: "arianna@grupowalnut.com",
      name: "Arianna",
      role: "user",
      purpose: "hogar",
      useCase: "shared",
      activeWorkspaceId: "ws-default",
      createdAt: new Date().toISOString(),
    },
  };

  const seedWorkspaces: Record<string, any> = {
    "ws-default": {
      id: "ws-default",
      name: "Casa de Daniel (Hogar)",
      type: "shared",
      inviteCode: "503020",
      ownerId: "usr-daniel-master",
      membersCount: 2,
      createdAt: new Date().toISOString(),
    },
  };

  const seedMembers = [
    {
      id: "mem-daniel",
      workspaceId: "ws-default",
      userId: "worldmaster2114@gmail.com",
      role: "owner",
      joinedAt: new Date().toISOString(),
    },
    {
      id: "mem-arianna",
      workspaceId: "ws-default",
      userId: "arianna@grupowalnut.com",
      role: "member",
      joinedAt: new Date().toISOString(),
    },
  ];

  return {
    users: seedUsers,
    workspaces: seedWorkspaces,
    workspaceMembers: seedMembers,
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

      // Ensure seed users always exist
      if (!storage.users || Object.keys(storage.users).length === 0) {
        storage.users = getEmptyStorage().users;
      } else {
        if (!storage.users["worldmaster2114@gmail.com"]) {
          storage.users["worldmaster2114@gmail.com"] = getEmptyStorage().users["worldmaster2114@gmail.com"];
        }
        if (!storage.users["arianna@grupowalnut.com"] && !Object.values(storage.users).some((u: any) => (u.name || '').toLowerCase().includes('arianna') || (u.name || '').toLowerCase().includes('ariadna'))) {
          storage.users["arianna@grupowalnut.com"] = getEmptyStorage().users["arianna@grupowalnut.com"];
        }
      }

      // Ensure seed workspace exists
      if (!storage.workspaces || Object.keys(storage.workspaces).length === 0) {
        storage.workspaces = getEmptyStorage().workspaces;
      } else if (!storage.workspaces["ws-default"]) {
        storage.workspaces["ws-default"] = getEmptyStorage().workspaces["ws-default"];
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
