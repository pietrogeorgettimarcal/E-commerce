import { ShoppingBag, Gem, User, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  user: any;
  cartCount: number;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onSignOut: () => void;
}

export function Header({ user, cartCount, onOpenAuth, onOpenCart, onSignOut }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
        >
          <Gem className="w-5 h-5 text-accent" />
          <span className="font-['Playfair_Display'] font-semibold text-xl text-foreground tracking-wide">
            Lumière
          </span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* User menu or login */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {displayName[0].toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-foreground max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { onSignOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <User className="w-4 h-4" />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
