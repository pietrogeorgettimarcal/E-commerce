import { useState } from "react";
import { Shield, Loader2, Lock } from "lucide-react";

interface AdminLoginProps {
  apiBase: string;
  accessToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminLogin({ apiBase, accessToken, onSuccess, onCancel }: AdminLoginProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/admin/add`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido');
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold">Acesso Restrito</h2>
            <p className="text-xs text-muted-foreground">Apenas administradores</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Esta área é exclusiva para administradores. Digite o código de acesso para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Código de administrador"
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-xl text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Digite o código de administrador para acessar o painel.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
