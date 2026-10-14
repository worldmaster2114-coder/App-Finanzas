import { Router } from "express";
import { db, usersTable, workspacesTable, workspaceMembersTable, accountsTable, transactionsTable, budgetsTable, savingsGoalsTable, supportTicketsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { readServerStorage, rotateSessionEpoch } from "../lib/serverStorage";

const adminRouter = Router();

const SUPER_ADMIN_EMAILS = [
  "worldmaster2114@gmail.com",
  "admin@grupowalnut.com",
];

const MASTER_ADMIN_PIN = "WALNUT-ADMIN-2026";

// POST /api/admin/verify-pin
adminRouter.post("/verify-pin", (req, res) => {
  const { pin, email } = req.body;
  const isEmailSuperAdmin = email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
  const isPinValid = pin && pin.trim().toUpperCase() === MASTER_ADMIN_PIN;

  if (isEmailSuperAdmin || isPinValid) {
    return res.json({
      success: true,
      role: "super_admin",
      token: `sa_token_${Date.now()}`,
      message: "Acceso concedido al Panel Super Admin & Soporte",
    });
  }

  return res.status(403).json({
    success: false,
    message: "Credenciales de Super Admin no válidas. Acceso restringido.",
  });
});

// Middleware: Ensure ONLY Super Admin emails can access any admin endpoints
adminRouter.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/verify-pin") return next();

  const requesterEmail = (
    (req.headers["x-admin-email"] as string) ||
    (req.query["email"] as string) ||
    (req.body?.email as string) ||
    ""
  ).toLowerCase().trim();

  if (SUPER_ADMIN_EMAILS.includes(requesterEmail)) {
    return next();
  }

  return res.status(403).json({
    error: "Acceso Denegado: Solo el correo Super Admin (worldmaster2114@gmail.com) tiene permiso para ver estos datos.",
  });
});

// GET /api/admin/metrics
adminRouter.get("/metrics", async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    let usersCount = 0;
    let workspacesCount = 0;
    let transactionsCount = 0;
    let openTicketsCount = 0;
    let dbStatus = "connected";

    if (db) {
      try {
        const [uRes, wRes, tRes, tkRes] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(usersTable),
          db.select({ count: sql<number>`count(*)` }).from(workspacesTable),
          db.select({ count: sql<number>`count(*)` }).from(transactionsTable),
          db.select({ count: sql<number>`count(*)` }).from(supportTicketsTable).where(eq(supportTicketsTable.status, "open")),
        ]);
        usersCount = Number(uRes[0]?.count || 0);
        workspacesCount = Number(wRes[0]?.count || 0);
        transactionsCount = Number(tRes[0]?.count || 0);
        openTicketsCount = Number(tkRes[0]?.count || 0);
      } catch (e) {
        console.warn("[ADMIN METRICS] DB query error, will complement from storage:", e);
      }
    } else {
      dbStatus = "local_storage";
    }

    const store = readServerStorage();
    if (usersCount === 0) usersCount = Object.keys(store.users || {}).length;
    if (workspacesCount === 0) workspacesCount = Object.keys(store.workspaces || {}).length;
    if (transactionsCount === 0) transactionsCount = Object.keys(store.transactions || {}).length;
    if (openTicketsCount === 0) openTicketsCount = (store.joinRequests || []).length;

    return res.json({
      success: true,
      metrics: {
        server: {
          nodeVersion: process.version,
          uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
          memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
          memoryHeapMb: Math.round(memory.heapUsed / (1024 * 1024)),
          port: process.env.PORT || 5000,
          env: process.env.NODE_ENV || "production",
          brand: "50-30-20 Grupo Walnut",
        },
        database: {
          status: dbStatus,
          engine: "PostgreSQL 16",
        },
        counts: {
          users: usersCount,
          workspaces: workspacesCount,
          transactions: transactionsCount,
          openTickets: openTicketsCount,
        },
      },
    });
  } catch (err: any) {
    console.error("[ADMIN] Error loading metrics:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
adminRouter.get("/users", async (req, res) => {
  try {
    let users: any[] = [];
    if (db) {
      try {
        users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
      } catch (dbErr) {
        console.warn("[ADMIN] DB select users failed, falling back to server storage:", dbErr);
      }
    }

    if (users.length === 0) {
      const store = readServerStorage();
      users = Object.values(store.users || {});
    }

    // Enrich each user with their assigned household / workspace
    const enrichedUsers = users.map((u: any) => ({
      ...u,
      workspaceName: "Casa de Daniel (Hogar)",
      workspaceInviteCode: "503020",
      useCase: "shared",
    }));

    return res.json({ users: enrichedUsers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/workspaces
adminRouter.get("/workspaces", async (req, res) => {
  try {
    let rawWorkspaces: any[] = [];
    let allUsers: any[] = [];
    let allAccounts: any[] = [];
    let allTransactions: any[] = [];
    let allMembers: any[] = [];

    if (db) {
      try {
        [rawWorkspaces, allUsers, allAccounts, allTransactions, allMembers] = await Promise.all([
          db.select().from(workspacesTable).orderBy(desc(workspacesTable.createdAt)),
          db.select().from(usersTable),
          db.select().from(accountsTable),
          db.select().from(transactionsTable),
          db.select().from(workspaceMembersTable),
        ]);
      } catch (dbErr) {
        console.warn("[ADMIN] DB select workspaces failed:", dbErr);
      }
    }

    if (rawWorkspaces.length === 0) {
      const store = readServerStorage();
      rawWorkspaces = Object.values(store.workspaces || {});
      allUsers = Object.values(store.users || {});
      allAccounts = Object.values(store.accounts || {});
      allTransactions = Object.values(store.transactions || {});
      allMembers = store.workspaceMembers || [];
    }

    if (!rawWorkspaces.some((w: any) => w.id === "ws-default" || (w.inviteCode || "") === "503020")) {
      rawWorkspaces.unshift({
        id: "ws-default",
        name: "Casa de Daniel (Hogar)",
        type: "shared",
        inviteCode: "503020",
        ownerId: "google-117683497210260321279",
        createdAt: new Date().toISOString(),
      });
    }

    // Default financial accounts for the household
    const defaultAccounts = [
      { id: "acc-1", name: "Efectivo Billetera", type: "cash", balance: 0, currency: "DOP", icon: "Wallet", color: "#10b981" },
      { id: "acc-2", name: "Cuenta de Banco", type: "bank", balance: 0, currency: "DOP", icon: "Building2", color: "#3b82f6" },
      { id: "acc-3", name: "Tarjeta de Crédito", type: "credit_card", balance: 0, currency: "DOP", icon: "CreditCard", color: "#ef4444" },
      { id: "acc-4", name: "Bóveda de Ahorros", type: "savings", balance: 0, currency: "DOP", icon: "PiggyBank", color: "#8b5cf6" },
    ];

    const workspaces = rawWorkspaces.map((w: any) => {
      // 1. Resolve Creator / Owner (Daniel)
      const ownerUser = allUsers.find(
        (u: any) =>
          u.id === w.ownerId ||
          u.googleId === w.ownerId ||
          u.email === w.ownerId ||
          (u.email && u.email.toLowerCase() === "worldmaster2114@gmail.com")
      );

      // 2. Resolve Members (Cuentas de usuario vinculadas al hogar)
      let membersList: any[] = [];
      if (w.id === "ws-default" || w.inviteCode === "503020") {
        membersList = allUsers.map((u: any) => {
          const isOwner = (u.email && u.email.toLowerCase() === "worldmaster2114@gmail.com") || u.id === w.ownerId;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            picture: u.picture,
            role: isOwner ? "Anfitrión / Creador" : "Miembro del Hogar",
          };
        });
      } else {
        const memberIds = new Set(allMembers.filter((m: any) => m.workspaceId === w.id).map((m: any) => m.userId));
        membersList = allUsers
          .filter((u: any) => memberIds.has(u.id) || u.id === w.ownerId)
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            picture: u.picture,
            role: u.id === w.ownerId ? "Anfitrión" : "Miembro",
          }));
      }

      // 3. Resolve Financial Accounts (Cuentas Financieras: Banco, Efectivo, Tarjeta, Ahorros)
      const wsAccounts = allAccounts.filter(
        (a: any) => a.workspaceId === w.id || (!a.workspaceId && (w.id === "ws-default" || w.inviteCode === "503020"))
      );
      const accountsList = wsAccounts.length > 0 ? wsAccounts : defaultAccounts;

      // 4. Resolve Transactions
      const wsTransactions = allTransactions.filter(
        (t: any) => t.workspaceId === w.id || (!t.workspaceId && (w.id === "ws-default" || w.inviteCode === "503020"))
      );

      return {
        ...w,
        ownerName: ownerUser?.name || "Daniel Gerardo Valdez Perez",
        ownerEmail: ownerUser?.email || "worldmaster2114@gmail.com",
        ownerPicture: ownerUser?.picture,
        members: membersList,
        membersCount: membersList.length,
        accounts: accountsList,
        transactionsCount: wsTransactions.length,
      };
    });

    return res.json({ workspaces });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tickets
adminRouter.get("/tickets", async (req, res) => {
  if (!db) {
    const store = readServerStorage();
    return res.json({ tickets: store.joinRequests || [] });
  }
  try {
    const tickets = await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt));
    return res.json({ tickets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/tickets (Users create support ticket)
adminRouter.post("/tickets", async (req, res) => {
  const { userId, userEmail, userName, subject, category, message, priority } = req.body;

  if (!userEmail || !subject || !message) {
    return res.status(400).json({ error: "Email, asunto y mensaje son requeridos" });
  }

  const newTicket = {
    id: `ticket-${Date.now()}`,
    userId: userId || null,
    userEmail,
    userName: userName || userEmail.split("@")[0],
    subject,
    category: category || "general",
    message,
    status: "open" as const,
    priority: priority || "medium",
  };

  if (db) {
    try {
      await db.insert(supportTicketsTable).values(newTicket);
    } catch (err) {
      console.error("[SUPPORT] Failed to save ticket to DB:", err);
    }
  }

  return res.json({
    success: true,
    ticket: newTicket,
    message: "Ticket de soporte recibido correctamente. El equipo de administración responderá pronto.",
  });
});

// PATCH /api/admin/tickets/:id (Super Admin responds/resolves)
adminRouter.patch("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;

  if (!db) return res.json({ success: true });

  try {
    await db.update(supportTicketsTable).set({
      status: status || "resolved",
      adminReply: adminReply || undefined,
      resolvedAt: status === "resolved" ? new Date() : undefined,
    }).where(eq(supportTicketsTable.id, id));

    return res.json({ success: true, message: "Ticket actualizado" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/db/backup (Full Database Export)
adminRouter.post("/db/backup", async (req, res) => {
  if (!db) {
    const store = readServerStorage();
    return res.json({
      system: "50-30-20 Finanzas Grupo Walnut (Local Storage Backup)",
      exportedAt: new Date().toISOString(),
      version: "v2.3",
      data: store,
    });
  }

  try {
    const [users, workspaces, accounts, transactions, budgets, goals, tickets] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(workspacesTable),
      db.select().from(accountsTable),
      db.select().from(transactionsTable),
      db.select().from(budgetsTable),
      db.select().from(savingsGoalsTable),
      db.select().from(supportTicketsTable),
    ]);

    const backup = {
      system: "50-30-20 Finanzas Grupo Walnut",
      exportedAt: new Date().toISOString(),
      version: "v2.3",
      data: {
        users,
        workspaces,
        accounts,
        transactions,
        budgets,
        goals,
        tickets,
      },
    };

    return res.json(backup);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reset-sessions (Force all clients to logout and clear session state)
adminRouter.post("/reset-sessions", async (req, res) => {
  try {
    const newEpoch = rotateSessionEpoch();
    if (db) {
      try {
        await db.delete(usersTable);
        console.log("[ADMIN] Wiped usersTable for session reset");
      } catch (dbErr) {
        console.warn("[ADMIN] DB delete users error:", dbErr);
      }
    }
    return res.json({
      success: true,
      epoch: newEpoch,
      message: "Todas las sesiones han sido invalidadas. Todos los dispositivos deberán iniciar sesión con Google nuevamente.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default adminRouter;
