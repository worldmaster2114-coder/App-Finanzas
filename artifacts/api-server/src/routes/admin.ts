import { Router } from "express";
import { db, usersTable, workspacesTable, accountsTable, transactionsTable, budgetsTable, savingsGoalsTable, supportTicketsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

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
    } else {
      dbStatus = "local_memory";
    }

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
  if (!db) return res.json({ users: [] });
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/workspaces
adminRouter.get("/workspaces", async (req, res) => {
  if (!db) return res.json({ workspaces: [] });
  try {
    const workspaces = await db.select().from(workspacesTable).orderBy(desc(workspacesTable.createdAt));
    return res.json({ workspaces });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tickets
adminRouter.get("/tickets", async (req, res) => {
  if (!db) return res.json({ tickets: [] });
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
    return res.status(400).json({ error: "Base de datos no conectada" });
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

export default adminRouter;
