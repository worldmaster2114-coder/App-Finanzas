import { useEffect, useState } from 'react';
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
import { loadFinanceData, saveFinanceData } from '@/services/storage';
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
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const queryClient = new QueryClient();

export function AppShell() {
  const [dataState, setDataState] = useState<FinanceDataState>(loadFinanceData);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!dataState.user);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'budgets' | 'forecast' | 'history'>('dashboard');
  const [isFastEntryOpen, setIsFastEntryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
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

  // Save to localStorage on any data change
  useEffect(() => {
    saveFinanceData(dataState);
  }, [dataState]);

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

    setDataState((prev) => ({
      ...prev,
      user: userProfile,
      workspaces: [...(prev.workspaces || []), newWorkspace],
      activeWorkspace: newWorkspace,
    }));

    setIsOnboardingOpen(false);
  };

  // Google Login Handler
  const handleGoogleLogin = (googleUserData: Partial<UserProfile>) => {
    const updatedUser: UserProfile = {
      id: googleUserData.id || `usr-${Date.now()}`,
      googleId: googleUserData.googleId,
      email: googleUserData.email || '',
      name: googleUserData.name || 'Usuario Google',
      picture: googleUserData.picture,
      purpose: dataState.user?.purpose || 'controlar',
      useCase: dataState.user?.useCase || 'personal',
      hasCompletedOnboarding: dataState.user?.hasCompletedOnboarding || false,
    };

    setDataState((prev) => ({
      ...prev,
      user: updatedUser,
    }));
    setIsAuthenticated(true);

    // If new user who hasn't completed onboarding yet, open the secondary onboarding wizard!
    if (!updatedUser.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
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
      setDataState((prev) => ({
        ...prev,
        activeWorkspace: target,
      }));
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

    setDataState((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, newWs],
      activeWorkspace: newWs,
    }));
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

    setDataState((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, joinedWs],
      activeWorkspace: joinedWs,
    }));
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

    setDataState((prev) => {
      // Update account balances
      const updatedAccounts = prev.accounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        if (newTx.type === 'transfer' && acc.id === newTx.destinationAccountId) {
          return { ...acc, balance: acc.balance + newTx.amount };
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // Add Savings Goal Handler
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `sg-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    setDataState((prev) => ({
      ...prev,
      savingsGoals: [newGoal, ...prev.savingsGoals],
    }));
  };

  // Update Savings Goal Amount (Deposit / Withdraw)
  const handleUpdateGoalAmount = (goalId: string, deltaAmount: number, accountId: string) => {
    setDataState((prev) => {
      const updatedGoals = prev.savingsGoals.map((g) => {
        if (g.id === goalId) {
          const newCurrent = Math.max(0, g.currentAmount + deltaAmount);
          const status: SavingsGoal['status'] = newCurrent >= g.targetAmount ? 'completed' : 'active';
          return { ...g, currentAmount: newCurrent, status };
        }
        return g;
      });

      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === accountId) {
          return { ...a, balance: a.balance - deltaAmount };
        }
        return a;
      });

      return {
        ...prev,
        savingsGoals: updatedGoals,
        accounts: updatedAccounts,
      };
    });
  };

  // Add Budget Handler
  const handleAddBudget = (budgetData: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `b-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    setDataState((prev) => ({
      ...prev,
      budgets: [newBudget, ...prev.budgets],
    }));
  };

  // Add Recurring Transaction Handler
  const handleAddRecurring = (recData: Omit<RecurringTransaction, 'id'>) => {
    const newRec: RecurringTransaction = {
      ...recData,
      id: `rec-${Date.now()}`,
      workspaceId: activeWorkspace.id,
    };
    setDataState((prev) => ({
      ...prev,
      recurringTransactions: [newRec, ...prev.recurringTransactions],
    }));
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    const tx = dataState.transactions.find((t) => t.id === id);
    if (!tx) return;

    setDataState((prev) => {
      const updatedAccounts = prev.accounts.map((acc) => {
        if (acc.id === tx.accountId) {
          const delta = tx.type === 'income' ? -tx.amount : tx.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        if (tx.type === 'transfer' && acc.id === tx.destinationAccountId) {
          return { ...acc, balance: acc.balance - tx.amount };
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter((t) => t.id !== id),
      };
    });
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
        <div className="mt-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 text-left min-w-0 flex-1 hover:opacity-80 transition"
            >
              {dataState.user?.picture ? (
                <img src={dataState.user.picture} alt={dataState.user.name} className="h-8 w-8 rounded-full border border-sidebar-primary" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-extrabold">
                  {dataState.user?.name ? dataState.user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-sidebar-foreground">{dataState.user?.name || 'Invitado'}</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{dataState.user?.email || 'Clic para conectar Google'}</p>
              </div>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="grid h-7 w-7 place-items-center rounded-lg bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
              title="Ajustes de cuenta"
            >
              <LogIn size={14} />
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
            />
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
            Grupo Walnut v2.1
          </span>
        </div>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="p-2 text-foreground"
        >
          {dataState.user?.picture ? (
            <img src={dataState.user.picture} alt="User" className="h-7 w-7 rounded-full border border-primary" />
          ) : (
            <LogIn size={20} />
          )}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="h-full w-72 bg-sidebar p-5 text-sidebar-foreground shadow-2xl animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-sidebar-border">
              <div>
                <span className="font-serif text-xl font-bold block">50-30-20</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sidebar-primary">
                  Una app de Grupo Walnut
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 space-y-1">
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold ${
                      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'text-sidebar-foreground/70'
                    }`}
                  >
                    <Icon size={18} />
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
        {activeTab === 'dashboard' && (
          <DashboardAnalytics
            accounts={dataState.accounts}
            categories={dataState.categories}
            transactions={dataState.transactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
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

      {/* Mobile Floating Action Button (FAB - Monefy Style) */}
      <button
        onClick={() => setIsFastEntryOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl transition hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
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
        initialUser={dataState.user}
        onOpenGoogleLogin={() => {
          setIsAuthModalOpen(true);
        }}
        onComplete={handleOnboardingComplete}
      />

      {/* Google Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={dataState.user}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
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