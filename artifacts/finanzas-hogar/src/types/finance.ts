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
  isShared?: boolean;
  splitRatio?: number; // e.g. 50 for 50/50 split
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

export type BudgetRuleStrategy = '50-30-20' | '70-20-10' | '60-20-20' | '80-20' | 'custom';

export type BudgetRuleConfig = {
  strategy: BudgetRuleStrategy;
  needs: number;
  wants: number;
  savings: number;
};

export type DebtItem = {
  id: string;
  workspaceId?: string;
  name: string;
  totalBalance: number;
  minimumPayment: number;
  interestRate: number; // e.g. 18.5%
  dueDate?: string;
  category: 'credit_card' | 'loan' | 'mortgage' | 'personal';
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
  preferredRule?: BudgetRuleStrategy;
  customRuleConfig?: { needs: number; wants: number; savings: number };
};

export type Workspace = {
  id: string;
  name: string;
  type: 'personal' | 'shared';
  inviteCode: string;
  ownerId: string;
  membersCount: number;
  budgetRule?: BudgetRuleStrategy;
  customRuleConfig?: { needs: number; wants: number; savings: number };
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
  debts?: DebtItem[];
  budgetRuleConfig?: BudgetRuleConfig;
};
