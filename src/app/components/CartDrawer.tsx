import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { Product } from "./ProductCard";

export interface CartItem {
  product: Product;
  size: string;
  qty: number;
}

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, size: string, delta: number) => void;
  onRemove: (productId: string, size: string) => void;
  onCheckout: () => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export function CartDrawer({ items, onClose, onUpdateQty, onRemove, onCheckout, isLoggedIn, onOpenAuth }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  function handleCheckout() {
    if (!isLoggedIn) {
      onClose();
      onOpenAuth();
      return;
    }
    onCheckout();
  }

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-card shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-['Playfair_Display'] text-lg font-semibold">Carrinho</h2>
            <span className="text-sm text-muted-foreground">({items.length})</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-['Playfair_Display'] text-lg text-muted-foreground">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground mt-1">Adicione bijuterias ao seu carrinho</p>
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map(item => {
              const key = `${item.product.id}-${item.size}`;
              const photo = item.product.photos[0] || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop';
              return (
                <div key={key} className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img src={photo} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{item.product.name}</h4>
                    {item.size && item.size !== 'Único' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Tamanho: {item.size}</p>
                    )}
                    <p className="text-sm font-semibold text-primary mt-1">
                      R$ {(item.product.price * item.qty).toFixed(2).replace('.', ',')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-muted rounded-full px-1">
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.size, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.product.id, item.size)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-['Playfair_Display'] text-lg font-semibold text-foreground">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {isLoggedIn ? 'Finalizar Compra' : 'Entrar para comprar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
