import { useState } from 'react';
import { UserProfile } from '@/types/finance';
import { MessageSquare, Send, CheckCircle2, X, HelpCircle, Bug, Sparkles } from 'lucide-react';

type SupportTicketModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
};

export function SupportTicketModal({ isOpen, onClose, user }: SupportTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email || 'usuario@grupowalnut.com',
          userName: user?.name || 'Usuario 50-30-20',
          subject: subject.trim(),
          category,
          message: message.trim(),
          priority: 'medium',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Error al enviar el mensaje');
      }
    } catch (err) {
      setError('No se pudo enviar el mensaje. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <MessageSquare size={18} />
            </span>
            <div>
              <h3 className="font-serif text-base font-bold">Centro de Ayuda & Soporte</h3>
              <p className="text-[10px] text-muted-foreground">Equipo de Grupo Walnut</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500 shadow-xs">
              <CheckCircle2 size={30} />
            </div>
            <h4 className="font-serif text-lg font-bold text-foreground">¡Mensaje Enviado!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Hemos recibido tu solicitud de soporte. El equipo administrativo de <strong>Grupo Walnut</strong> la revisará en breve.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setSubject('');
                setMessage('');
                onClose();
              }}
              className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-foreground">Tipo de Solicitud</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary font-bold"
              >
                <option value="general">Consulta General</option>
                <option value="bug">Reportar un Error / Bug</option>
                <option value="feature">Sugerir una Funcionalidad</option>
                <option value="account">Problemas con mi Cuenta u Hogar</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Asunto</label>
              <input
                type="text"
                placeholder="Ej. Duda con el cálculo de la regla 50/30/20"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Detalle del Mensaje</label>
              <textarea
                rows={4}
                placeholder="Describe tu consulta con detalle..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:border-primary resize-none"
              />
            </div>

            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-md hover:brightness-105 transition"
            >
              <Send size={15} /> {loading ? 'Enviando...' : 'Enviar Solicitud a Soporte'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
