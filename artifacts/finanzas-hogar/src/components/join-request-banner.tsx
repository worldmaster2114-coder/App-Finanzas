import { useEffect, useState } from 'react';
import { UserProfile } from '@/types/finance';
import { Users, CheckCircle2, XCircle, HeartHandshake, AlertCircle } from 'lucide-react';

type JoinRequest = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPicture?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

type JoinRequestBannerProps = {
  currentUser: UserProfile | null;
  onAcceptedMember: (workspaceId: string) => void;
};

export function JoinRequestBanner({ currentUser, onAcceptedMember }: JoinRequestBannerProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchPendingRequests = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/finance/pending-requests?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.warn('Error fetching pending join requests:', err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 8000); // Poll every 8s for live notifications
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/respond-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(''), 4500);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (action === 'accept') {
          const reqItem = requests.find((r) => r.id === requestId);
          if (reqItem) onAcceptedMember(reqItem.workspaceId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (actionMessage) {
    return (
      <div className="mx-4 sm:mx-6 mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-500 flex items-center gap-2 animate-in fade-in-50">
        <CheckCircle2 size={18} /> {actionMessage}
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="mx-4 sm:mx-6 mt-4 space-y-2 animate-in slide-in-from-top-4">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-500/15 via-card to-purple-500/10 p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-500 text-white shadow-md">
              <HeartHandshake size={22} />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-foreground">Solicitud de Unión al Hogar</span>
                <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-400">
                  {req.workspaceName}
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-snug">
                <strong className="text-purple-400 font-bold">{req.requesterName}</strong> ({req.requesterEmail}) quiere unirse mediante el enlace para compartir contigo los gastos del hogar o de la vivienda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => handleRespond(req.id, 'reject')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            >
              <XCircle size={15} /> Rechazar
            </button>

            <button
              onClick={() => handleRespond(req.id, 'accept')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition"
            >
              <CheckCircle2 size={15} /> Aceptar y Compartir Hogar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
