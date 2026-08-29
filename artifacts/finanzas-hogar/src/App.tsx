import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FastEntryModal } from '@/components/fast-entry-modal';
import { DashboardAnalytics } from '@/components/dashboard-analytics';
import { SavingsVault } from '@/components/savings-vault';
import { BudgetManager } from '@/components/budget-manager';
import { FinancialForecast } from '@/components/financial-forecast';
import { TransactionHistory } from '@/components/transaction-history';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { AuthModal } from '@/components/auth-modal';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { LoginScreen } from '@/components/login-screen';
import { AdminSupportPanel } from '@/components/admin-support-panel';
import { SupportTicketModal } from '@/components/support-ticket-modal';
import { JoinRequestBanner } from '@/components/join-request-banner';
import { ShareHouseholdModal } from '@/components/share-household-modal';
import { UserAvatar } from '@/components/user-avatar';
import { loadFinanceData, saveFinanceData, saveToLocalStorage, syncFinanceDataToCloud } from '@/services/storage';
import { Budget, FinanceDataState, RecurringTransaction, SavingsGoal, Transaction, UserProfile, UserPurpose, UserUseCase, Workspace } from '@/types/finance';
import {
  Wallet,
  LayoutDashboard,
  PieChart as PieChartIcon,
  PiggyBank,
  AlertTriangle,
  CalendarDays,
  History,
  Plus,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  LogIn,
  LogOut,
  KeyRound,
  Users,
  Share2,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Cloud,
} from 'lucide-react';

const queryClient = new QueryClient();

export function AppShell() {
  const [dataState, setDataState] = useState<FinanceDataState>(loadFinanceData);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!dataState.user);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'budgets' | 'forecast' | 'history'>('dashboard');
  const [isFastEntryOpen, setIsFastEntryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
  const [isShareHouseholdOpen, setIsShareHouseholdOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Month & Year Filter state for analytics/budgets
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Active workspace fallback
  const activeWorkspace: Workspace = dataState.activeWorkspace || dataState.workspaces?.[0] || {
    id: 'ws-default',
    name: 'Presupuesto Personal',
    type: 'personal',
    inviteCode: '503020',
    ownerId: 'default-owner',
    membersCount: 1,
  };

  // Real-time Cloud Synchronization with PostgreSQL for Multi-Device Consistency (PC + Mobile)
  // Use useRef to hold the latest fetchCloudData so the interval always calls the fresh version
  const fetchCloudDataRef = useRef<((showLoading?: boolean) => Promise<void>) | null>(null);

  const fetchCloudData = async (showLoading = false) => {
    // Bug #5 fix: Skip fetch if no user is logged in
    if (!dataState.user?.email && !dataState.user?.id) return;

    if (showLoading) setIsSyncing(true);
    try {
      const email = dataState.user?.email ? encodeURIComponent(dataState.user.email) : '';
      const userId = dataState.user?.id ? encodeURIComponent(dataState.user.id) : '';
      const res = await fetch(`/api/finance/state?userId=${userId}&email=${email}`);
      const data = await res.json();

      if (data && data.status === 'synced') {
        setDataState((prev) => {
          // Merge remote workspaces
          const remoteWorkspaces: Workspace[] = Array.isArray(data.workspaces) && data.workspaces.length > 0
            ? data.workspaces
            : prev.workspaces;

          // Resolve active workspace
          const remoteActiveId = data.activeWorkspaceId || prev.activeWorkspace?.id;
          const matchedActive = remoteWorkspaces.find((w) => w.id === remoteActiveId) || remoteWorkspaces[0] || prev.activeWorkspace;

          // Merge remote transactions with local ones by unique ID
          let remoteTransactions: Transaction[];
          if (Array.isArray(data.transactions)) {
            const txMap = new Map<string, Transaction>();
            data.transactions.forEach((tx: Transaction) => txMap.set(tx.id, tx));
            prev.transactions.forEach((tx: Transaction) => {
              if (!txMap.has(tx.id)) txMap.set(tx.id, tx);
            });
            remoteTransactions = Array.from(txMap.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          } else {
            remoteTransactions = prev.transactions;
          }

          // Merge accounts
          const remoteAccounts = Array.isArray(data.accounts) && data.accounts.length > 0
            ? data.accounts
            : prev.accounts;

          // Merge budgets by category/id
          let remoteBudgets: Budget[];
          if (Array.isArray(data.budgets)) {
            const bMap = new Map<string, Budget>();
            data.budgets.forEach((b: Budget) => bMap.set(b.id, b));
            prev.budgets.forEach((b: Budget) => {
              if (!bMap.has(b.id)) bMap.set(b.id, b);
            });
            remoteBudgets = Array.from(bMap.values());
          } else {
            remoteBudgets = prev.budgets;
          }

          const remoteGoals = Array.isArray(data.savingsGoals) && data.savingsGoals.length > 0 ? data.savingsGoals : prev.savingsGoals;
          const remoteRecurring = Array.isArray(data.recurringTransactions) && data.recurringTransactions.length > 0
            ? data.recurringTransactions
            : prev.recurringTransactions;

          // Merge categories
          const remoteCategories = Array.isArray(data.categories) && data.categories.length > 0
            ? data.categories
            : prev.categories;

          const merged: FinanceDataState = {
            ...prev,
            user: data.user ? { ...prev.user, ...data.user } : prev.user,
            workspaces: remoteWorkspaces,
            activeWorkspace: matchedActive,
            accounts: remoteAccounts,
            categories: remoteCategories,
            transactions: remoteTransactions,
            budgets: remoteBudgets,
            savingsGoals: remoteGoals,
            recurringTransactions: remoteRecurring,
          };

          // Save directly to localStorage without re-triggering remote sync loop
          saveToLocalStorage(merged);

          return merged;
        });
      }
    } catch (err) {
      console.warn('[CLOUD SYNC] Error fetching cloud state:', err);
    } finally {
      if (showLoading) {
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  };

  // Bug #2 fix: Keep ref always pointing to latest fetchCloudData
  fetchCloudDataRef.current = fetchCloudData;

  // Poll cloud state periodically and on window focus for instant multi-device sync
  useEffect(() => {
    // Use the ref so interval always uses the latest fetchCloudData (no stale closure)
    const call = (showLoading?: boolean) => fetchCloudDataRef.current?.(showLoading);

    call(false); // initial fetch on mount / user change

    const interval = setInterval(() => call(false), 5000); // Live sync every 5 seconds

    const handleFocus = () => call(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') call(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [dataState.user?.id, dataState.user?.email]);


  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (data: {
    name: string;
    currency: string;
    purpose: UserPurpose;
    useCase: UserUseCase;
    workspaceName: string;
    inviteCodeToJoin?: string;
  }) => {
    const userProfile: UserProfile = {
      id: dataState.user?.id || `usr-${Date.now()}`,
      email: dataState.user?.email || 'usuario@grupowalnut.com',
      name: data.name,
      picture: dataState.user?.picture,
      purpose: data.purpose,
      useCase: data.useCase,
      hasCompletedOnboarding: true,
    };

    let newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: data.workspaceName,
      type: data.useCase,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      ownerId: userProfile.id,
      membersCount: data.useCase === 'shared' ? 2 : 1,
    };

    setDataState((prev) => {
      const existing = prev.workspaces || [];
      const isInitialDefault = existing.length === 1 && (existing[0].name === 'Presupuesto Personal' || existing[0].name === 'Mi Presupuesto');
      
      let updatedWorkspaces: Workspace[];
      let nextActive: Workspace;

      if (isInitialDefault) {
        // Update the single default workspace rather than creating a duplicate
        nextActive = {
          ...existing[0],
          name: data.workspaceName,
          type: data.useCase,
        };
        updatedWorkspaces = [nextActive];
      } else {
        updatedWorkspaces = [...existing, newWorkspace];
        nextActive = newWorkspace;
      }

      return {
        ...prev,
        user: userProfile,
        workspaces: updatedWorkspaces,
        activeWorkspace: nextActive,
      };
    });

    setIsOnboardingOpen(false);
  };

  // Google Login Handler
  const handleGoogleLogin = (googleUserData: Partial<UserProfile>) => {
    const userId = googleUserData.id || `usr-${Date.now()}`;
    const updatedUser: UserProfile = {
      id: userId,
      googleId: googleUserData.googleId || googleUserData.id,
      email: googleUserData.email || '',
      name: googleUserData.name || 'Usuario',
      picture: googleUserData.picture,
      purpose: dataState.user?.purpose || 'controlar',
      useCase: dataState.user?.useCase || 'personal',
      hasCompletedOnboarding: true,
    };

    setDataState((prev) => {
      // Ensure the active workspace is owned by this real user (fix ws-default issue)
      const existingWorkspaces = prev.workspaces || [];
      let updatedWorkspaces = existingWorkspaces;
      let updatedActiveWorkspace = prev.activeWorkspace;

      // If the only workspace is the generic default (not owned by a real user), re-assign it
      const isGenericDefault =
        existingWorkspaces.length === 1 &&
        (existingWorkspaces[0].ownerId === 'usr-default' || existingWorkspaces[0].ownerId === 'default-owner');

      if (isGenericDefault) {
        const reassigned: Workspace = {
          ...existingWorkspaces[0],
          ownerId: userId,
        };
        updatedWorkspaces = [reassigned];
        updatedActiveWorkspace = reassigned;
      }

      const nextState: FinanceDataState = {
        ...prev,
        user: updatedUser,
        workspaces: updatedWorkspaces,
        activeWorkspace: updatedActiveWorkspace,
      };

      // Immediately sync to cloud so PostgreSQL knows this user and workspace
      syncFinanceDataToCloud(nextState, true);

      return nextState;
    });

    setIsAuthenticated(true);
    setIsOnboardingOpen(false);

    // If registered via invitation link (?join=XYZ123), notify the owner!
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('join');
      if (inviteCode) {
        fetch('/api/finance/join-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode,
            requester: updatedUser,
          }),
        }).catch((err) => console.warn('Error submitting join request:', err));

        // Join workspace locally as well
        handleJoinSharedWorkspace(inviteCode);
      }
    }
  };


  // User Profile & Configuration Update Handler
  const handleUpdateUser = (updatedUserData: Partial<UserProfile>) => {
    if (!dataState.user) return;
    const updated = {
      ...dataState.user,
      ...updatedUserData,
    };
    const nextState: FinanceDataState = {
      ...dataState,
      user: updated,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Logout Handler
  const handleLogout = () => {
    setDataState((prev) => ({
      ...prev,
      user: null,
    }));
    setIsAuthenticated(false);
  };

  // Switch Workspace Handler
  const handleSwitchWorkspace = (workspaceId: string) => {
    const target = dataState.workspaces.find((w) => w.id === workspaceId);
    if (target) {
      const nextState: FinanceDataState = {
        ...dataState,
        activeWorkspace: target,
      };
      setDataState(nextState);
      syncFinanceDataToCloud(nextState, true);
    }
  };

  // Create Shared Workspace Handler
  const handleCreateSharedWorkspace = (name: string) => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      type: 'shared',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      ownerId: dataState.user?.id || 'usr-default',
      membersCount: 1,
    };

    const nextState: FinanceDataState = {
      ...dataState,
      workspaces: [...dataState.workspaces, newWs],
      activeWorkspace: newWs,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Join Shared Workspace Handler
  const handleJoinSharedWorkspace = (code: string) => {
    const joinedWs: Workspace = {
      id: `ws-joined-${Date.now()}`,
      name: `Hogar (${code})`,
      type: 'shared',
      inviteCode: code,
      ownerId: 'owner-other',
      membersCount: 2,
    };

    const nextState: FinanceDataState = {
      ...dataState,
      workspaces: [...dataState.workspaces, joinedWs],
      activeWorkspace: joinedWs,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Delete Workspace Handler
  const handleDeleteWorkspace = (workspaceId: string) => {
    const filtered = dataState.workspaces.filter((w) => w.id !== workspaceId);
    if (filtered.length === 0) return;
    const nextActive = dataState.activeWorkspace?.id === workspaceId ? filtered[0] : dataState.activeWorkspace;
    const nextState: FinanceDataState = {
      ...dataState,
      workspaces: filtered,
      activeWorkspace: nextActive,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Ensure Shared Invite Code
  const handleEnsureSharedCode = (): string => {
    if (activeWorkspace?.inviteCode) return activeWorkspace.inviteCode;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDataState((prev) => {
      const activeId = prev.activeWorkspace?.id || 'ws-default';
      const updatedWorkspaces: Workspace[] = prev.workspaces.map((w) =>
        w.id === activeId ? { ...w, inviteCode: code, type: 'shared' as const } : w
      );
      const targetWs: Workspace = updatedWorkspaces.find((w) => w.id === activeId) || {
        id: activeId,
        name: prev.activeWorkspace?.name || 'Mi Hogar Compartido',
        type: 'shared' as const,
        inviteCode: code,
        ownerId: prev.user?.id || 'default-owner',
        membersCount: 1,
      };
      return {
        ...prev,
        workspaces: updatedWorkspaces,
        activeWorkspace: targetWs,
      };
    });
    return code;
  };

  // Fast Entry Save Handler
  const handleSaveTransaction = (newTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workspaceId: activeWorkspace.id,
      createdByUserId: dataState.user?.id,
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = dataState.accounts.map((acc) => {
      if (acc.id === newTx.accountId) {
        const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        return { ...acc, balance: acc.balance + delta };
      }
      if (newTx.type === 'transfer' && acc.id === newTx.destinationAccountId) {
        return { ...acc, balance: acc.balance + newTx.amount };
      }
      return acc;
    });

    const nextState: FinanceDataState = {
      ...dataState,
      accounts: updatedAccounts,
      transactions: [newTx, ...dataState.transactions],
    };

    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Add Savings Goal Handler
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `sg-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    const nextState = {
      ...dataState,
      savingsGoals: [newGoal, ...dataState.savingsGoals],
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Update Savings Goal Amount (Deposit / Withdraw)
  const handleUpdateGoalAmount = (goalId: string, deltaAmount: number, accountId: string) => {
    const updatedGoals = dataState.savingsGoals.map((g) => {
      if (g.id === goalId) {
        const newCurrent = Math.max(0, g.currentAmount + deltaAmount);
        const status: SavingsGoal['status'] = newCurrent >= g.targetAmount ? 'completed' : 'active';
        return { ...g, currentAmount: newCurrent, status };
      }
      return g;
    });

    const updatedAccounts = dataState.accounts.map((a) => {
      if (a.id === accountId) {
        return { ...a, balance: a.balance - deltaAmount };
      }
      return a;
    });

    const nextState = {
      ...dataState,
      savingsGoals: updatedGoals,
      accounts: updatedAccounts,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Add Budget Handler
  const handleAddBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `b-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    const nextState = {
      ...dataState,
      budgets: [newBudget, ...dataState.budgets],
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Update Budget Handler
  const handleUpdateBudget = (budget: Budget) => {
    const updatedBudgets = dataState.budgets.map((b) => (b.id === budget.id ? budget : b));
    const nextState = {
      ...dataState,
      budgets: updatedBudgets,
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Delete Budget Handler
  const handleDeleteBudget = (budgetId: string) => {
    fetch('/api/finance/budget/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: budgetId }),
    }).catch(console.warn);

    const nextState = {
      ...dataState,
      budgets: dataState.budgets.filter((b) => b.id !== budgetId),
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Add Recurring Transaction Handler
  const handleAddRecurring = (recData: Omit<RecurringTransaction, 'id'>) => {
    const newRec: RecurringTransaction = {
      ...recData,
      id: `rec-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    const nextState = {
      ...dataState,
      recurringTransactions: [newRec, ...dataState.recurringTransactions],
    };
    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    const tx = dataState.transactions.find((t) => t.id === id);
    if (!tx) return;

    fetch('/api/finance/transaction/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(console.warn);

    const updatedAccounts = dataState.accounts.map((acc) => {
      if (acc.id === tx.accountId) {
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...acc, balance: acc.balance + delta };
      }
      if (tx.type === 'transfer' && acc.id === tx.destinationAccountId) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      return acc;
    });

    const nextState = {
      ...dataState,
      accounts: updatedAccounts,
      transactions: dataState.transactions.filter((t) => t.id !== id),
    };

    setDataState(nextState);
    syncFinanceDataToCloud(nextState, true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Resumen y Analítica', icon: LayoutDashboard },
    { id: 'goals', label: 'Bóveda de Ahorros', icon: PiggyBank },
    { id: 'budgets', label: 'Presupuestos', icon: PieChartIcon },
    { id: 'forecast', label: 'Gastos Fijos & Proyección', icon: CalendarDays },
    { id: 'history', label: 'Historial & Exportación', icon: History },
  ] as const;

  // Dedicated Login Screen as the Primary Entry Point
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        onEnterAsGuest={() => setIsAuthenticated(true)}
      />
    );
  }

  const isSuperAdmin = Boolean(
    dataState.user?.email &&
    ['worldmaster2114@gmail.com', 'admin@grupowalnut.com'].includes(dataState.user.email.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground border-r border-sidebar-border">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Wallet size={22} strokeWidth={2.3} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="block font-serif text-xl font-bold leading-tight">50-30-20</span>
                <span className="rounded-md bg-sidebar-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sidebar-primary">
                  Grupo Walnut v2.2
                </span>
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/60">
                Regla 50/30/20 & Control
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
            title="Cambiar Modo Oscuro / Claro"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* User Profile Card / Auth Button */}
        <div className={`mt-5 rounded-2xl border ${isSuperAdmin ? 'border-amber-500/40 bg-amber-500/10' : 'border-sidebar-border bg-sidebar-accent/50'} p-3`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:opacity-80 transition"
            >
              <UserAvatar
                picture={dataState.user?.picture}
                name={dataState.user?.name}
                size="sm"
                isSuperAdmin={isSuperAdmin}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate text-sidebar-foreground">{dataState.user?.name || 'Invitado'}</p>
                  {isSuperAdmin && (
                    <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[8px] font-extrabold uppercase text-amber-500">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{dataState.user?.email || 'Clic para conectar Google'}</p>
              </div>
            </button>

            <button
              onClick={() => isSuperAdmin ? setIsAdminPanelOpen(true) : setIsAuthModalOpen(true)}
              className={`grid h-7 w-7 place-items-center rounded-lg ${isSuperAdmin ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground'} transition`}
              title={isSuperAdmin ? "Panel Super Admin" : "Ajustes de cuenta"}
            >
              {isSuperAdmin ? <ShieldAlert size={15} /> : <LogIn size={14} />}
            </button>
          </div>

          {/* Workspace Switcher Component */}
          <div className="mt-3 pt-2.5 border-t border-sidebar-border">
            <WorkspaceSwitcher
              activeWorkspace={activeWorkspace}
              workspaces={dataState.workspaces || [activeWorkspace]}
              user={dataState.user}
              onSwitchWorkspace={handleSwitchWorkspace}
              onCreateSharedWorkspace={handleCreateSharedWorkspace}
              onJoinSharedWorkspace={handleJoinSharedWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
            />
          </div>

          {/* Real-time Cloud Sync Status */}
          <div className="mt-2.5 pt-2 border-t border-sidebar-border/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fetchCloudData(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-sidebar-foreground/70 hover:text-primary transition"
              title="Sincronizar datos con PostgreSQL"
            >
              <RefreshCw size={11} className={isSyncing ? "animate-spin text-primary" : "text-emerald-500"} />
              <span>{isSyncing ? "Sincronizando..." : "Nube PostgreSQL Conectada"}</span>
            </button>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-6 flex-1 space-y-1">
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">Navegación</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition focus-ring ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-sidebar-border/60 space-y-1">
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">Centro de Asistencia</p>
            
            <button
              onClick={() => setIsSupportTicketModalOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition"
            >
              <HelpCircle size={17} className="text-primary" />
              <span>Ayuda & Soporte</span>
            </button>

            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={17} />
                <span>Panel Super Admin</span>
              </div>
              <span className="rounded-md bg-amber-500/30 px-1.5 py-0.2 text-[9px] font-extrabold">ADMIN</span>
            </button>
          </div>
        </div>

        {/* Fast Action Card */}
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <Sparkles size={16} />
            <span className="text-xs font-bold">Fast Entry (Monefy)</span>
          </div>
          <p className="mt-1 text-[11px] text-sidebar-foreground/70 leading-relaxed">
            Registra ingresos y gastos en 2 segundos con el teclado táctil in-app.
          </p>
          <button
            onClick={() => setIsFastEntryOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sidebar-primary px-3 py-2 text-xs font-bold text-sidebar-primary-foreground shadow-xs hover:brightness-105"
          >
            <Plus size={16} /> Registrar Ahora
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:hidden">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-foreground">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 font-serif text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wallet size={18} />
          </span>
          <span>50-30-20</span>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary">
            Grupo Walnut
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCloudData(true)}
            className="p-1.5 rounded-lg text-foreground/80 hover:text-primary transition hover:bg-secondary/60"
            title="Sincronizar con PostgreSQL"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin text-primary" : "text-emerald-500"} />
          </button>
          <button
            onClick={() => setIsShareHouseholdOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-400 hover:bg-purple-500/25 transition shadow-xs"
            title="Compartir Hogar mediante Enlace"
          >
            <Share2 size={13} /> Compartir
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="p-1 text-foreground"
          >
            {dataState.user ? (
              <UserAvatar picture={dataState.user.picture} name={dataState.user.name} size="xs" isSuperAdmin={isSuperAdmin} />
            ) : (
              <LogIn size={20} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="h-full w-72 bg-sidebar p-5 text-sidebar-foreground shadow-2xl animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2 font-serif font-bold">
                <Wallet size={18} className="text-primary" />
                <span>50-30-20</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-sidebar-foreground/70">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                      isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs' : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 max-w-7xl mx-auto w-full">
        
        {/* Real-time Join Request Approval Banner for Household Owner */}
        <JoinRequestBanner
          currentUser={dataState.user}
          onAcceptedMember={(wsId) => {
            handleSwitchWorkspace(wsId);
          }}
        />

        {activeTab === 'dashboard' && (
          <DashboardAnalytics
            accounts={dataState.accounts}
            categories={dataState.categories}
            transactions={dataState.transactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onOpenShareHousehold={() => setIsShareHouseholdOpen(true)}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsVault
            goals={dataState.savingsGoals}
            accounts={dataState.accounts}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoalAmount={handleUpdateGoalAmount}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager
            budgets={dataState.budgets}
            categories={dataState.categories}
            transactions={dataState.transactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'forecast' && (
          <FinancialForecast
            accounts={dataState.accounts}
            categories={dataState.categories}
            recurringTransactions={dataState.recurringTransactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onAddRecurring={handleAddRecurring}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory
            transactions={dataState.transactions}
            accounts={dataState.accounts}
            categories={dataState.categories}
            fullDataState={dataState}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Footer Credit */}
        <footer className="mt-12 text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
          <p>50-30-20 — Una plataforma desarrollada por <strong className="text-foreground font-semibold">Grupo Walnut</strong> · v2.3 · 2026</p>
        </footer>
      </main>

      {/* Modern Mobile Bottom Navigation Bar (App Nativa Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border/80 bg-card/95 backdrop-blur-md px-2 md:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
            activeTab === 'dashboard' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard size={19} />
          <span className="text-[10px] tracking-tight">Resumen</span>
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
            activeTab === 'budgets' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PieChartIcon size={19} />
          <span className="text-[10px] tracking-tight">Presupuesto</span>
        </button>

        {/* Central Prominent Quick Entry Button */}
        <div className="relative -top-3 flex items-center justify-center px-1">
          <button
            onClick={() => setIsFastEntryOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 active:scale-95"
            title="Registro Rápido (1 toque)"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
            activeTab === 'goals' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PiggyBank size={19} />
          <span className="text-[10px] tracking-tight">Bóveda</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
            activeTab === 'history' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History size={19} />
          <span className="text-[10px] tracking-tight">Historial</span>
        </button>
      </nav>

      {/* Desktop Floating Action Button (FAB) */}
      <button
        onClick={() => setIsFastEntryOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 z-30 h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl transition hover:scale-105 active:scale-95"
        title="Registro Rápido (1 toque)"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Fast Entry Modal */}
      <FastEntryModal
        isOpen={isFastEntryOpen}
        onClose={() => setIsFastEntryOpen(false)}
        accounts={dataState.accounts}
        categories={dataState.categories}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialUser={dataState.user}
        onComplete={handleOnboardingComplete}
      />

      {/* Google Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={dataState.user}
        onGoogleLogin={handleGoogleLogin}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
      />

      {/* Super Admin & Support Panel */}
      <AdminSupportPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUser={dataState.user}
      />

      {/* Support Inquiries Modal for Users */}
      <SupportTicketModal
        isOpen={isSupportTicketModalOpen}
        onClose={() => setIsSupportTicketModalOpen(false)}
        user={dataState.user}
      />

      {/* Share Household Modal */}
      <ShareHouseholdModal
        isOpen={isShareHouseholdOpen}
        onClose={() => setIsShareHouseholdOpen(false)}
        workspace={activeWorkspace}
        currentUser={dataState.user}
        onEnsureSharedCode={handleEnsureSharedCode}
      />

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </QueryClientProvider>
  );
}