import { Router } from "express";
import {
  db,
  accountsTable,
  categoriesTable,
  transactionsTable,
  budgetsTable,
  savingsGoalsTable,
  recurringTransactionsTable,
  workspacesTable,
  usersTable,
  workspaceMembersTable,
  workspaceJoinRequestsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const financeRouter = Router();

// GET /api/finance/state
financeRouter.get("/state", async (req, res) => {
  if (!db) {
    return res.json({ status: "local_only", message: "Database not connected" });
  }

  try {
    const workspaceId = req.query["workspaceId"] as string | undefined;

    const [accounts, categories, transactions, budgets, savingsGoals, recurringTransactions] = await Promise.all([
      db.select().from(accountsTable),
      db.select().from(categoriesTable),
      db.select().from(transactionsTable),
      db.select().from(budgetsTable),
      db.select().from(savingsGoalsTable),
      db.select().from(recurringTransactionsTable),
    ]);

    return res.json({
      status: "synced",
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurringTransactions,
    });
  } catch (err: any) {
    console.error("[API] Error fetching finance state:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/sync
financeRouter.post("/sync", async (req, res) => {
  if (!db) {
    return res.json({ status: "local_saved", message: "Database not configured, using local storage" });
  }

  try {
    const { accounts, categories, transactions, budgets, savingsGoals, recurringTransactions, user, activeWorkspace } = req.body;

    // 1. Sync User if present
    if (user && user.id) {
      await db.insert(usersTable).values({
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        purpose: user.purpose,
        useCase: user.useCase,
        activeWorkspaceId: activeWorkspace?.id,
      }).onConflictDoUpdate({
        target: usersTable.id,
        set: {
          name: user.name,
          purpose: user.purpose,
          useCase: user.useCase,
          activeWorkspaceId: activeWorkspace?.id,
        },
      });
    }

    // 2. Sync Workspace if present
    if (activeWorkspace && activeWorkspace.id) {
      await db.insert(workspacesTable).values({
        id: activeWorkspace.id,
        name: activeWorkspace.name,
        type: activeWorkspace.type || "personal",
        inviteCode: activeWorkspace.inviteCode || "503020",
        ownerId: activeWorkspace.ownerId || user?.id || "usr-default",
      }).onConflictDoUpdate({
        target: workspacesTable.id,
        set: {
          name: activeWorkspace.name,
          type: activeWorkspace.type || "personal",
        },
      });
    }

    // 3. Sync Accounts
    if (Array.isArray(accounts) && accounts.length > 0) {
      for (const acc of accounts) {
        await db.insert(accountsTable).values({
          id: acc.id,
          workspaceId: activeWorkspace?.id,
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency || "DOP",
          color: acc.color,
          icon: acc.icon,
        }).onConflictDoUpdate({
          target: accountsTable.id,
          set: {
            name: acc.name,
            balance: acc.balance,
            color: acc.color,
            icon: acc.icon,
          },
        });
      }
    }

    // 4. Sync Transactions
    if (Array.isArray(transactions) && transactions.length > 0) {
      for (const tx of transactions) {
        await db.insert(transactionsTable).values({
          id: tx.id,
          workspaceId: activeWorkspace?.id,
          accountId: tx.accountId,
          categoryId: tx.categoryId,
          amount: tx.amount,
          type: tx.type,
          destinationAccountId: tx.destinationAccountId,
          date: tx.date,
          note: tx.note,
          isRecurring: tx.isRecurring || false,
          createdByUserId: user?.id,
        }).onConflictDoNothing();
      }
    }

    return res.json({ success: true, message: "Datos sincronizados con PostgreSQL exitosamente" });
  } catch (err: any) {
    console.error("[API] Error syncing to PostgreSQL:", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/join-info?code=...
financeRouter.get("/join-info", async (req, res) => {
  const code = req.query["code"] as string;
  if (!code) {
    return res.status(400).json({ error: "Código de invitación requerido" });
  }

  if (!db) {
    return res.json({
      workspace: { id: `ws-${code}`, name: "Hogar Compartido", inviteCode: code },
      ownerName: "Tu Pareja o Familiar",
    });
  }

  try {
    const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteCode, code)).limit(1);
    if (!ws || ws.length === 0) {
      return res.status(404).json({ error: "Espacio u hogar no encontrado con este enlace" });
    }

    const workspace = ws[0];
    const owner = await db.select().from(usersTable).where(eq(usersTable.id, workspace.ownerId)).limit(1);

    return res.json({
      workspace,
      ownerName: owner[0]?.name || "El anfitrión del hogar",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/join-request
financeRouter.post("/join-request", async (req, res) => {
  const { inviteCode, requester } = req.body;
  if (!inviteCode || !requester || !requester.id) {
    return res.status(400).json({ error: "Datos de usuario o código inválidos" });
  }

  if (!db) {
    return res.json({ success: true, message: "Solicitud enviada en modo local" });
  }

  try {
    const ws = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteCode, inviteCode)).limit(1);
    if (!ws || ws.length === 0) {
      return res.status(404).json({ error: "El espacio u hogar no existe" });
    }

    const workspace = ws[0];

    const requestId = `req-${Date.now()}`;
    const newRequest = {
      id: requestId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerId: workspace.ownerId,
      requesterId: requester.id,
      requesterName: requester.name || requester.email.split("@")[0],
      requesterEmail: requester.email || "",
      requesterPicture: requester.picture || null,
      status: "pending" as const,
    };

    await db.insert(workspaceJoinRequestsTable).values(newRequest);

    return res.json({
      success: true,
      requestId,
      workspaceName: workspace.name,
      message: `Solicitud enviada a ${workspace.name}. El anfitrión la aprobará en breve.`,
    });
  } catch (err: any) {
    console.error("[JOIN_REQUEST]", err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/pending-requests?userId=...
financeRouter.get("/pending-requests", async (req, res) => {
  const userId = req.query["userId"] as string;
  if (!userId) return res.json({ requests: [] });

  if (!db) return res.json({ requests: [] });

  try {
    const requests = await db
      .select()
      .from(workspaceJoinRequestsTable)
      .where(eq(workspaceJoinRequestsTable.ownerId, userId))
      .orderBy(desc(workspaceJoinRequestsTable.createdAt));

    const pendingOnly = requests.filter((r) => r.status === "pending");
    return res.json({ requests: pendingOnly });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/respond-request
financeRouter.post("/respond-request", async (req, res) => {
  const { requestId, action } = req.body; // action: 'accept' | 'reject'
  if (!requestId || !action) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  if (!db) return res.json({ success: true });

  try {
    const reqFound = await db.select().from(workspaceJoinRequestsTable).where(eq(workspaceJoinRequestsTable.id, requestId)).limit(1);
    if (!reqFound || reqFound.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const request = reqFound[0];
    const newStatus = action === "accept" ? "accepted" : "rejected";

    await db.update(workspaceJoinRequestsTable).set({
      status: newStatus,
      respondedAt: new Date(),
    }).where(eq(workspaceJoinRequestsTable.id, requestId));

    if (action === "accept") {
      // Add member to workspace members
      await db.insert(workspaceMembersTable).values({
        id: `wm-${Date.now()}`,
        workspaceId: request.workspaceId,
        userId: request.requesterId,
        role: "member",
      });

      // Update user active workspace
      await db.update(usersTable).set({
        activeWorkspaceId: request.workspaceId,
        useCase: "shared",
      }).where(eq(usersTable.id, request.requesterId));
    }

    return res.json({
      success: true,
      status: newStatus,
      requesterName: request.requesterName,
      message: action === "accept"
        ? `¡Has aceptado a ${request.requesterName}! Ahora comparten los gastos del hogar.`
        : `Solicitud de ${request.requesterName} rechazada.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default financeRouter;
