export type AccountType = 'cash' | 'bank' | 'credit_card' | 'savings';

export type Account = {
  id: string;
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
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  destinationAccountId?: string;
  date: string;
  note?: string;
  isRecurring: boolean;
  createdAt: string;
};

export type BudgetPeriod = 'weekly' | 'monthly' | 'annual';

export type Budget = {
  id: string;
  categoryId?: string; // null/undefined if global
  amountLimit: number;
  period: BudgetPeriod;
  startDate: string;
  alertThreshold: number; // e.g. 80 for 80%
};

export type SavingsGoalStatus = 'active' | 'completed' | 'paused';

export type SavingsGoal = {
  id: string;
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
  accountId: string;
  categoryId: string;
  amount: number;
  type: CategoryType;
  frequency: RecurringFrequency;
  nextExecutionDate: string;
  autoApply: boolean;
  note?: string;
};

export type FinanceDataState = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringTransactions: RecurringTransaction[];
};
