import { useState } from "react";
import { X, Loader2, CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import { CartItem } from "./CartDrawer";

interface CheckoutModalProps {
  items: CartItem[];
  onClose: () => void;
  onConfirm: (address: any, paymentMethod: string) => Promise<void>;
}

type Step = 'address' | 'payment' | 'success';

export function CheckoutModal({ items, onClose, onConfirm }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [address, setAddress] = useState({
    fullName: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', zip: '',
  });

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required = ['fullName', 'street', 'number', 'city', 'state', 'zip'] as const;
    for (const field of required) {
      if (!address[field].trim()) { setError('Preencha todos os campos obrigatórios.'); return; }
    }
    setError('');
    setStep('payment');
  }

  async function handlePayment() {
    setLoading(true);
    setError('');
    try {
      await onConfirm(address, paymentMethod);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background rounded-xl text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-['Playfair_Display'] text-xl font-semibold">
            {step === 'address' ? 'Endereço de entrega' : step === 'payment' ? 'Forma de pagamento' : 'Pedido confirmado!'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === 'address' && (
            <form onSubmit={handleAddressSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome completo *</label>
                <input className={inputCls} value={address.fullName} onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))} placeholder="Seu nome completo" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Rua / Avenida *</label>
                  <input className={inputCls} value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="Nome da rua" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número *</label>
                  <input className={inputCls} value={address.number} onChange={e => setAddress(a => ({ ...a, number: e.target.value }))} placeholder="123" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Complemento</label>
                  <input className={inputCls} value={address.complement} onChange={e => setAddress(a => ({ ...a, complement: e.target.value }))} placeholder="Apto, Bloco..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <input className={inputCls} value={address.neighborhood} onChange={e => setAddress(a => ({ ...a, neighborhood: e.target.value }))} placeholder="Bairro" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade *</label>
                  <input className={inputCls} value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Sua cidade" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado *</label>
                  <input className={inputCls} value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CEP *</label>
                <input className={inputCls} value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} placeholder="00000-000" maxLength={9} />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  Continuar para pagamento
                </button>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <div className="px-6 py-5 space-y-5">
              {/* Order summary */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-foreground mb-3">Resumo do pedido</p>
                {items.map(item => (
                  <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product.name} × {item.qty}</span>
                    <span className="font-medium">R$ {(item.product.price * item.qty).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Payment options */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Forma de pagamento</p>
                {[
                  { id: 'pix' as const, icon: <QrCode className="w-5 h-5" />, label: 'PIX', sub: 'Aprovação instantânea' },
                  { id: 'credit' as const, icon: <CreditCard className="w-5 h-5" />, label: 'Cartão de Crédito', sub: 'Em até 12x sem juros' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className={paymentMethod === opt.id ? 'text-primary' : 'text-muted-foreground'}>{opt.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.sub}</p>
                    </div>
                    {paymentMethod === opt.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep('address')} className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                  Voltar
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Pedido
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="px-6 py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground">Pedido realizado!</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Seu pedido foi confirmado com sucesso. Você receberá atualizações por e-mail.
              </p>
              <div className="bg-muted rounded-xl p-4 text-left space-y-1 mt-4">
                <p className="text-sm font-medium">Entrega para:</p>
                <p className="text-sm text-muted-foreground">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.street}, {address.number} – {address.city}/{address.state}</p>
              </div>
              <button onClick={onClose} className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Continuar comprando
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
