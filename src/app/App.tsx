import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Toaster, toast } from "sonner";
import { Header } from "./components/Header";
import { StorePage } from "./components/StorePage";
import { CartDrawer, CartItem } from "./components/CartDrawer";
import { AuthModal } from "./components/AuthModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { AdminPanel } from "./components/AdminPanel";
import { AdminSetup } from "./components/AdminSetup";
import { Product } from "./components/ProductCard";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b41c106b`;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<"store" | "admin">("store");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check admin when user changes
  useEffect(() => {
    if (!user || !session?.access_token) {
      setIsAdmin(false);
      setView("store");
      return;
    }
    fetch(`${API_BASE}/admin/check`, { headers: authHeaders(session.access_token) })
      .then(r => r.json())
      .then(d => setIsAdmin(d.isAdmin || false))
      .catch(() => setIsAdmin(false));
  }, [user, session]);

  // Load products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Error fetching products:", e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Auth functions
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    toast.success("Bem-vinda de volta! 💫");
  }

  async function signUp(email: string, password: string, name: string) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao criar conta");
    await signInWithEmail(email, password);
    toast.success("Conta criada com sucesso! ✨");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setView("store");
    toast.success("Até logo!");
  }

  // Cart functions
  function addToCart(product: Product, size: string) {
    setCart(prev => {
      const key = `${product.id}-${size}`;
      const existing = prev.find(i => `${i.product.id}-${i.size}` === key);
      if (existing) {
        return prev.map(i => `${i.product.id}-${i.size}` === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, size, qty: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`, { duration: 2000 });
    setShowCart(true);
  }

  function updateCartQty(productId: string, size: string, delta: number) {
    setCart(prev => {
      const key = `${productId}-${size}`;
      return prev
        .map(i => `${i.product.id}-${i.size}` === key ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0);
    });
  }

  function removeFromCart(productId: string, size: string) {
    const key = `${productId}-${size}`;
    setCart(prev => prev.filter(i => `${i.product.id}-${i.size}` !== key));
  }

  async function handleCheckout(address: any, paymentMethod: string) {
    if (!session?.access_token) throw new Error("Não autenticado");
    const items = cart.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      size: i.size,
      price: i.product.price,
      qty: i.qty,
    }));
    const total = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: authHeaders(session.access_token),
      body: JSON.stringify({ items, total, address, paymentMethod }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao criar pedido");
    setCart([]);
    setShowCheckout(false);
    toast.success("Pedido realizado com sucesso! 🎉");
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <Header
        user={user}
        isAdmin={isAdmin}
        cartCount={cartCount}
        view={view}
        onOpenAuth={() => setShowAuth(true)}
        onOpenCart={() => setShowCart(true)}
        onSignOut={signOut}
        onViewChange={(v) => {
          if (v === "admin" && !isAdmin) {
            setShowAdminSetup(true);
          } else {
            setView(v);
          }
        }}
      />

      {/* Main content */}
      <main className="pt-16">
        {view === "store" ? (
          loadingProducts ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando coleção...</p>
              </div>
            </div>
          ) : (
            <StorePage products={products} onAddToCart={addToCart} />
          )
        ) : (
          session?.access_token && (
            <AdminPanel accessToken={session.access_token} apiBase={API_BASE} />
          )
        )}
      </main>

      {/* Footer */}
      {view === "store" && (
        <footer className="bg-foreground text-background mt-16">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-['Playfair_Display'] text-xl text-background mb-3">Lumière</h3>
                <p className="text-background/60 text-sm leading-relaxed">
                  Bijuterias com alma. Cada peça é escolhida com cuidado para celebrar a feminilidade.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-background mb-3 text-sm tracking-wide uppercase">Categorias</h4>
                <ul className="space-y-2 text-sm text-background/60">
                  {['Colares', 'Brincos', 'Anéis', 'Pulseiras', 'Conjuntos'].map(c => (
                    <li key={c}><span className="hover:text-background/90 cursor-pointer transition-colors">{c}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-background mb-3 text-sm tracking-wide uppercase">Atendimento</h4>
                <ul className="space-y-2 text-sm text-background/60">
                  <li>contato@lumiere.com.br</li>
                  <li>Seg–Sex, 9h–18h</li>
                  <li>Envio para todo o Brasil</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-background/40 text-xs">© 2025 Lumière Bijuterias. Todos os direitos reservados.</p>
              {user && !isAdmin && (
                <button
                  onClick={() => setShowAdminSetup(true)}
                  className="text-background/30 text-xs hover:text-background/50 transition-colors"
                >
                  Área restrita
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      {showCart && (
        <CartDrawer
          items={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
          isLoggedIn={!!user}
          onOpenAuth={() => { setShowCart(false); setShowAuth(true); }}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSignInWithGoogle={signInWithGoogle}
          onSignInWithEmail={signInWithEmail}
          onSignUp={signUp}
        />
      )}

      {showCheckout && user && (
        <CheckoutModal
          items={cart}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckout}
        />
      )}

      {showAdminSetup && user && session?.access_token && (
        <AdminSetup
          apiBase={API_BASE}
          accessToken={session.access_token}
          onSuccess={() => {
            setIsAdmin(true);
            setView("admin");
            setShowAdminSetup(false);
            toast.success("Acesso admin concedido! 🛡️");
          }}
        />
      )}
    </div>
  );
}
