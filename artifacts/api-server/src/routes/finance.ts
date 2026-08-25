import { Router } from "express";
import { db, accountsTable, categoriesTable, transactionsTable, budgetsTable, savingsGoalsTable, recurringTransactionsTable, workspacesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default financeRouter;
