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
import { eq, or, desc, and, isNull } from "drizzle-orm";

const financeRouter = Router();

// GET /api/finance/state?userId=...&email=...&workspaceId=...
financeRouter.get("/state", async (req, res) => {
  if (!db) {
    return res.json({ status: "local_only", message: "Database not connected" });
  }

  try {
    const userId = req.query["userId"] as string | undefined;
    const email = req.query["email"] as string | undefined;

    // --- 1. Resolve user record ---
    let userRecord: any = null;
    if (email) {
      const u = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
      if (u.length > 0) userRecord = u[0];
    } else if (userId) {
      const u = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (u.length > 0) userRecord = u[0];
    }

    // No user found → return empty (do NOT leak other users' data)
    if (!userRecord) {
      return res.json({
        status: "synced",
        user: null,
        workspaces: [],
        activeWorkspaceId: null,
        accounts: [],
        categories: [],
        transactions: [],
        budgets: [],
        savingsGoals: [],
        recurringTransactions: [],
      });
    }

    // --- 2. Fetch workspaces this user owns OR is member of ---
    const owned = await db
      .select()
      .from(workspacesTable)
      .where(or(
        eq(workspacesTable.ownerId, userRecord.id),
        eq(workspacesTable.ownerId, userRecord.email),
        userRecord.activeWorkspaceId ? eq(workspacesTable.id, userRecord.activeWorkspaceId) : eq(workspacesTable.ownerId, userRecord.id)
      ));

    const memberRows = await db
      .select()
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.userId, userRecord.id));

    let memberWs: any[] = [];
    for (const mRow of memberRows) {
      const found = await db.select().from(workspacesTable).where(eq(workspacesTable.id, mRow.workspaceId));
      if (found.length > 0) memberWs.push(found[0]);
    }

    // Deduplicate workspaces
    const wsMap = new Map<string, any>();
    for (const w of [...owned, ...memberWs]) wsMap.set(w.id, w);
    const workspaces = Array.from(wsMap.values());

    // --- 3. Determine which workspace IDs belong to this user ---
    const wsIds: string[] = workspaces.map((w) => w.id);

    // --- 4. Fetch all data SCOPED to user's workspaces & defaults ---
    const wsFilter = (col: any) =>
      wsIds.length > 0
        ? or(...wsIds.map((id) => eq(col, id)), isNull(col))
        : isNull(col);

    const [accounts, categories, transactions, budgets, savingsGoals, recurringTransactions] = await Promise.all([
      db.select().from(accountsTable).where(
        wsIds.length > 0
          ? or(...wsIds.map((id) => eq(accountsTable.workspaceId, id)), isNull(accountsTable.workspaceId), eq(accountsTable.workspaceId, "ws-default"))
          : isNull(accountsTable.workspaceId)
      ),
      db.select().from(categoriesTable).where(
        wsIds.length > 0
          ? or(...wsIds.map((id) => eq(categoriesTable.workspaceId, id)), eq(categoriesTable.isDefault, true), isNull(categoriesTable.workspaceId))
          : or(eq(categoriesTable.isDefault, true), isNull(categoriesTable.workspaceId))
      ),
      db.select().from(transactionsTable)
        .where(
          wsIds.length > 0
            ? or(
                ...wsIds.map((id) => eq(transactionsTable.workspaceId, id)),
                eq(transactionsTable.createdByUserId, userRecord.id),
                eq(transactionsTable.createdByUserId, userRecord.email)
              )
            : or(
                eq(transactionsTable.createdByUserId, userRecord.id),
                eq(transactionsTable.createdByUserId, userRecord.email)
              )
        )
        .orderBy(desc(transactionsTable.createdAt)),
      db.select().from(budgetsTable).where(wsFilter(budgetsTable.workspaceId)),
      db.select().from(savingsGoalsTable).where(wsFilter(savingsGoalsTable.workspaceId)),
      db.select().from(recurringTransactionsTable).where(wsFilter(recurringTransactionsTable.workspaceId)),
    ]);

    return res.json({
      status: "synced",
      user: userRecord,
      workspaces: workspaces.length > 0 ? workspaces : null,
      activeWorkspaceId: userRecord?.activeWorkspaceId || workspaces[0]?.id || null,
      accounts: accounts.length > 0 ? accounts : [],
      categories: categories.length > 0 ? categories : null,
      transactions: transactions || [],
      budgets: budgets || [],
      savingsGoals: savingsGoals || [],
      recurringTransactions: recurringTransactions || [],
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
    const {
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurringTransactions,
      user,
      activeWorkspace,
      workspaces,
    } = req.body;

    // 1. Sync User if present (safely handle email uniqueness)
    let resolvedUserId = user?.id;
    if (user && (user.id || user.email)) {
      const normalizedEmail = user.email ? user.email.toLowerCase().trim() : null;
      let existingUser = null;
      if (normalizedEmail) {
        const found = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
        if (found.length > 0) existingUser = found[0];
      } else if (user.id) {
        const found = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
        if (found.length > 0) existingUser = found[0];
      }

      if (existingUser) {
        resolvedUserId = existingUser.id;
        await db
          .update(usersTable)
          .set({
            name: user.name || existingUser.name,
            picture: user.picture || existingUser.picture,
            googleId: user.googleId || existingUser.googleId,
            purpose: user.purpose || existingUser.purpose,
            useCase: user.useCase || existingUser.useCase,
            activeWorkspaceId: activeWorkspace?.id || existingUser.activeWorkspaceId,
          })
          .where(eq(usersTable.id, existingUser.id));
      } else {
        const uId = user.id || `usr-${Date.now()}`;
        resolvedUserId = uId;
        await db.insert(usersTable).values({
          id: uId,
          googleId: user.googleId,
          email: normalizedEmail || `user-${uId}@grupowalnut.com`,
          name: user.name || "Usuario",
          picture: user.picture,
          purpose: user.purpose,
          useCase: user.useCase || "personal",
          activeWorkspaceId: activeWorkspace?.id,
        });
      }
    }

    // 2. Sync all Workspaces if present (safely handle inviteCode uniqueness)
    const allWorkspaces = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces : activeWorkspace ? [activeWorkspace] : [];
    for (const ws of allWorkspaces) {
      if (!ws.id) continue;
      const wsOwnerId = ws.ownerId && ws.ownerId !== "usr-default" && ws.ownerId !== "default-owner" ? ws.ownerId : (resolvedUserId || "usr-default");
      const existingWs = await db.select().from(workspacesTable).where(eq(workspacesTable.id, ws.id)).limit(1);
      if (existingWs.length > 0) {
        await db
          .update(workspacesTable)
          .set({
            name: ws.name || existingWs[0].name,
            type: ws.type || existingWs[0].type,
            inviteCode: ws.inviteCode || existingWs[0].inviteCode,
            ownerId: wsOwnerId || existingWs[0].ownerId,
          })
          .where(eq(workspacesTable.id, ws.id));
      } else {
        let code = ws.inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        const codeConflict = await db.select().from(workspacesTable).where(eq(workspacesTable.inviteCode, code)).limit(1);
        if (codeConflict.length > 0 && codeConflict[0].id !== ws.id) {
          code = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        await db.insert(workspacesTable).values({
          id: ws.id,
          name: ws.name || "Mi Espacio",
          type: ws.type || "personal",
          inviteCode: code,
          ownerId: wsOwnerId,
        });
      }
    }

    // 3. Sync Accounts
    if (Array.isArray(accounts) && accounts.length > 0) {
      for (const acc of accounts) {
        await db
          .insert(accountsTable)
          .values({
            id: acc.id,
            workspaceId: activeWorkspace?.id,
            name: acc.name,
            type: acc.type,
            balance: acc.balance || 0,
            currency: acc.currency || "DOP",
            color: acc.color || "#3b82f6",
            icon: acc.icon || "Wallet",
          })
          .onConflictDoUpdate({
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

    // 4. Sync Categories (with workspaceId so they are isolated per user)
    if (Array.isArray(categories) && categories.length > 0) {
      for (const cat of categories) {
        if (!cat.id) continue;
        await db
          .insert(categoriesTable)
          .values({
            id: cat.id,
            workspaceId: cat.workspaceId || activeWorkspace?.id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon || "Tag",
            color: cat.color || "#6b7280",
            isDefault: cat.isDefault || false,
            parentId: cat.parentId || null,
          })
          .onConflictDoUpdate({
            target: categoriesTable.id,
            set: {
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
            },
          });
      }
    }

    // 5. Sync Transactions
    if (Array.isArray(transactions) && transactions.length > 0) {
      for (const tx of transactions) {
        await db
          .insert(transactionsTable)
          .values({
            id: tx.id,
            workspaceId: tx.workspaceId || activeWorkspace?.id,
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            amount: tx.amount,
            type: tx.type,
            destinationAccountId: tx.destinationAccountId,
            date: tx.date,
            note: tx.note,
            isRecurring: tx.isRecurring || false,
            createdByUserId: tx.createdByUserId || user?.id,
          })
          .onConflictDoUpdate({
            target: transactionsTable.id,
            set: {
              amount: tx.amount,
              type: tx.type,
              note: tx.note,
              date: tx.date,
              accountId: tx.accountId,
              categoryId: tx.categoryId,
            },
          });
      }
    }

    // 5. Sync Budgets
    if (Array.isArray(budgets) && budgets.length > 0) {
      for (const b of budgets) {
        await db
          .insert(budgetsTable)
          .values({
            id: b.id,
            workspaceId: activeWorkspace?.id,
            categoryId: b.categoryId,
            amountLimit: b.amountLimit,
            period: b.period || "monthly",
            startDate: b.startDate,
            alertThreshold: b.alertThreshold || 80,
          })
          .onConflictDoUpdate({
            target: budgetsTable.id,
            set: {
              amountLimit: b.amountLimit,
              alertThreshold: b.alertThreshold,
            },
          });
      }
    }

    // 6. Sync Savings Goals
    if (Array.isArray(savingsGoals) && savingsGoals.length > 0) {
      for (const g of savingsGoals) {
        await db
          .insert(savingsGoalsTable)
          .values({
            id: g.id,
            workspaceId: activeWorkspace?.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount || 0,
            deadline: g.deadline,
            color: g.color || "#10b981",
            icon: g.icon || "Target",
            status: g.status || "active",
          })
          .onConflictDoUpdate({
            target: savingsGoalsTable.id,
            set: {
              currentAmount: g.currentAmount,
              targetAmount: g.targetAmount,
              status: g.status,
            },
          });
      }
    }

    // 7. Sync Recurring Transactions
    if (Array.isArray(recurringTransactions) && recurringTransactions.length > 0) {
      for (const rec of recurringTransactions) {
        if (!rec.id) continue;
        await db
          .insert(recurringTransactionsTable)
          .values({
            id: rec.id,
            workspaceId: rec.workspaceId || activeWorkspace?.id,
            accountId: rec.accountId,
            categoryId: rec.categoryId,
            amount: rec.amount,
            type: rec.type,
            frequency: rec.frequency || "monthly",
            nextExecutionDate: rec.nextExecutionDate,
            autoApply: rec.autoApply ?? true,
            note: rec.note || null,
          })
          .onConflictDoUpdate({
            target: recurringTransactionsTable.id,
            set: {
              amount: rec.amount,
              frequency: rec.frequency,
              nextExecutionDate: rec.nextExecutionDate,
              autoApply: rec.autoApply,
              note: rec.note,
            },
          });
      }
    }

    return res.json({ success: true, message: "Datos sincronizados con PostgreSQL exitosamente" });
  } catch (err: any) {
    console.error("[API] Error syncing to PostgreSQL:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/transaction/delete
financeRouter.post("/transaction/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id required" });
  if (!db) return res.json({ success: true, message: "Deleted locally" });

  try {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    return res.json({ success: true, message: "Transacción eliminada de PostgreSQL" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/budget/delete
financeRouter.post("/budget/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id required" });
  if (!db) return res.json({ success: true, message: "Deleted locally" });

  try {
    await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
    return res.json({ success: true, message: "Presupuesto eliminado de PostgreSQL" });
  } catch (err: any) {
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

    // Create a join request for the workspace owner to approve
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(workspaceJoinRequestsTable).values({
      id: requestId,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerId: workspace.ownerId,
      requesterId: requester.id,
      requesterName: requester.name || "Nuevo Miembro",
      requesterEmail: requester.email || "",
      requesterPicture: requester.picture,
      status: "pending",
    });

    return res.json({
      success: true,
      message: `Solicitud enviada al creador de "${workspace.name}" para unirte.`,
      workspace,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/pending-requests?userId=...
financeRouter.get("/pending-requests", async (req, res) => {
  const userId = req.query["userId"] as string;
  if (!userId) {
    return res.status(400).json({ error: "userId requerido" });
  }

  if (!db) {
    return res.json({ requests: [] });
  }

  try {
    const pending = await db
      .select()
      .from(workspaceJoinRequestsTable)
      .where(and(eq(workspaceJoinRequestsTable.ownerId, userId), eq(workspaceJoinRequestsTable.status, "pending")))
      .orderBy(desc(workspaceJoinRequestsTable.createdAt));

    return res.json({ requests: pending });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/respond-request
financeRouter.post("/respond-request", async (req, res) => {
  const { requestId, action } = req.body;
  if (!requestId || !["accept", "reject"].includes(action)) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  if (!db) {
    return res.json({ success: true, message: action === "accept" ? "Miembro aceptado en modo local" : "Solicitud rechazada" });
  }

  try {
    const reqs = await db.select().from(workspaceJoinRequestsTable).where(eq(workspaceJoinRequestsTable.id, requestId)).limit(1);
    if (!reqs || reqs.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const request = reqs[0];
    const newStatus = action === "accept" ? "accepted" : "rejected";

    await db
      .update(workspaceJoinRequestsTable)
      .set({
        status: newStatus,
        respondedAt: new Date(),
      })
      .where(eq(workspaceJoinRequestsTable.id, requestId));

    if (action === "accept") {
      // Add member to workspace_members table
      const memberId = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(workspaceMembersTable).values({
        id: memberId,
        workspaceId: request.workspaceId,
        userId: request.requesterId,
        role: "member",
      });
    }

    return res.json({
      success: true,
      message: action === "accept" ? `¡${request.requesterName} ha sido añadido a tu Hogar!` : "Solicitud de unión rechazada.",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export { financeRouter };
export default financeRouter;
