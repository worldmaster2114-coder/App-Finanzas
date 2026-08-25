export type AccountType = 'cash' | 'bank' | 'credit_card' | 'savings';

export type Account = {
  id: string;
  workspaceId?: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
};

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  workspaceId?: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  parentId?: string;
};

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  workspaceId?: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  destinationAccountId?: string;
  date: string;
  note?: string;
  isRecurring: boolean;
  createdByUserId?: string;
  createdAt: string;
};

export type BudgetPeriod = 'weekly' | 'monthly' | 'annual';

export type Budget = {
  id: string;
  workspaceId?: string;
  categoryId?: string;
  amountLimit: number;
  period: BudgetPeriod;
  startDate: string;
  alertThreshold: number;
};

export type SavingsGoalStatus = 'active' | 'completed' | 'paused';

export type SavingsGoal = {
  id: string;
  workspaceId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
  status: SavingsGoalStatus;
};

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurringTransaction = {
  id: string;
  workspaceId?: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: CategoryType;
  frequency: RecurringFrequency;
  nextExecutionDate: string;
  autoApply: boolean;
  note?: string;
};

export type UserPurpose = 'ahorrar' | 'controlar' | 'deudas' | 'hogar';
export type UserUseCase = 'personal' | 'shared';

export type UserProfile = {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  picture?: string;
  purpose?: UserPurpose;
  useCase?: UserUseCase;
  activeWorkspaceId?: string;
  hasCompletedOnboarding: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  inviteCode: string;
  ownerId: string;
  membersCount: number;
};

export type FinanceDataState = {
  user: UserProfile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];
};
