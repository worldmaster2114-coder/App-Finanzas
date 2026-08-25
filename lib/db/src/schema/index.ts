import { pgTable, text, real, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// 0. USERS TABLE
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  picture: text("picture"),
  role: text("role").$type<"super_admin" | "admin" | "user">().default("user").notNull(),
  purpose: text("purpose"), // e.g. "ahorrar", "controlar", "deudas", "hogar"
  useCase: text("use_case").$type<"personal" | "shared">().default("personal"),
  activeWorkspaceId: text("active_workspace_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// WORKSPACES / HOGARES TABLE
export const workspacesTable = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<"personal" | "shared">().notNull().default("personal"),
  inviteCode: text("invite_code").notNull().unique(), // 6-digit code for 2-3 members
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceSchema = createInsertSchema(workspacesTable);
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspacesTable.$inferSelect;

// WORKSPACE MEMBERS TABLE
export const workspaceMembersTable = pgTable("workspace_members", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").$type<"owner" | "member">().notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembersTable);
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembersTable.$inferSelect;

// WORKSPACE JOIN REQUESTS TABLE (Enlace de Invitación & Aprobación)
export const workspaceJoinRequestsTable = pgTable("workspace_join_requests", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  workspaceName: text("workspace_name").notNull(),
  ownerId: text("owner_id").notNull(),
  requesterId: text("requester_id").notNull(),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email").notNull(),
  requesterPicture: text("requester_picture"),
  status: text("status").$type<"pending" | "accepted" | "rejected">().notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const insertWorkspaceJoinRequestSchema = createInsertSchema(workspaceJoinRequestsTable);
export type InsertWorkspaceJoinRequest = z.infer<typeof insertWorkspaceJoinRequestSchema>;
export type WorkspaceJoinRequest = typeof workspaceJoinRequestsTable.$inferSelect;

// 1. ACCOUNTS TABLE
export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  name: text("name").notNull(),
  type: text("type").$type<"cash" | "bank" | "credit_card" | "savings">().notNull(),
  balance: real("balance").notNull().default(0),
  currency: text("currency").notNull().default("DOP"),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").notNull().default("Wallet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accountsTable);
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;

// 2. CATEGORIES TABLE
export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  name: text("name").notNull(),
  type: text("type").$type<"income" | "expense">().notNull(),
  icon: text("icon").notNull().default("Tag"),
  color: text("color").notNull().default("#6b7280"),
  isDefault: boolean("is_default").notNull().default(false),
  parentId: text("parent_id"),
});

export const insertCategorySchema = createInsertSchema(categoriesTable);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

// 3. TRANSACTIONS TABLE
export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  accountId: text("account_id").notNull(),
  categoryId: text("category_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").$type<"income" | "expense" | "transfer">().notNull(),
  destinationAccountId: text("destination_account_id"),
  date: text("date").notNull(),
  note: text("note"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

// 4. BUDGETS TABLE
export const budgetsTable = pgTable("budgets", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  categoryId: text("category_id"),
  amountLimit: real("amount_limit").notNull(),
  period: text("period").$type<"weekly" | "monthly" | "annual">().notNull().default("monthly"),
  startDate: text("start_date").notNull(),
  alertThreshold: integer("alert_threshold").notNull().default(80),
});

export const insertBudgetSchema = createInsertSchema(budgetsTable);
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgetsTable.$inferSelect;

// 5. SAVINGS GOALS TABLE
export const savingsGoalsTable = pgTable("savings_goals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  deadline: text("deadline").notNull(),
  color: text("color").notNull().default("#10b981"),
  icon: text("icon").notNull().default("Target"),
  status: text("status").$type<"active" | "completed" | "paused">().notNull().default("active"),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable);
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;

// 6. RECURRING TRANSACTIONS TABLE
export const recurringTransactionsTable = pgTable("recurring_transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id"),
  accountId: text("account_id").notNull(),
  categoryId: text("category_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").$type<"income" | "expense">().notNull(),
  frequency: text("frequency").$type<"daily" | "weekly" | "monthly" | "yearly">().notNull().default("monthly"),
  nextExecutionDate: text("next_execution_date").notNull(),
  autoApply: boolean("auto_apply").notNull().default(true),
  note: text("note"),
});

export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactionsTable);
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;
export type RecurringTransaction = typeof recurringTransactionsTable.$inferSelect;

// 7. SUPPORT TICKETS TABLE
export const supportTicketsTable = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull().default("general"),
  message: text("message").notNull(),
  status: text("status").$type<"open" | "in_progress" | "resolved">().notNull().default("open"),
  priority: text("priority").$type<"low" | "medium" | "high" | "urgent">().notNull().default("medium"),
  adminReply: text("admin_reply"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable);
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;