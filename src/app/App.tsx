import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { Toaster, toast } from "sonner";
import { Header } from "./components/Header";
import { StorePage } from "./components/StorePage";
import { CartDrawer, CartItem } from "./components/CartDrawer";
import { AuthModal } from "./components/AuthModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { AdminPanel } from "./components/AdminPanel";
import { AdminLogin } from "./components/AdminLogin";
import { Product } from "./components/ProductCard";
import { getStockQuantity } from "./components/ui/utils";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b41c106b`;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // 1. Quando o site abre ou o utilizador muda, carrega o carrinho correto
  useEffect(() => {
    const cartKey = user ? `carrinho_${user.id}` : 'carrinho_visitante';
    const carrinhoGuardado = localStorage.getItem(cartKey);
    
    if (carrinhoGuardado) {
      setCart(JSON.parse(carrinhoGuardado));
    } else {
      setCart([]); // Se não tem carrinho guardado para esta conta, esvazia
    }
  }, [user]); // Dispara sempre que o 'user' loga ou desloga

  // 2. Sempre que o carrinho for alterado, guarda no cofre do utilizador
  useEffect(() => {
    // Só guarda se houver algo para guardar ou se o carrinho acabou de ser limpo
    const cartKey = user ? `carrinho_${user.id}` : 'carrinho_visitante';
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, user]);

  // Check if trying to access admin route
  const isAdminRoute = window.location.pathname === '/admin' || window.location.hash === '#/admin' || window.location.hash === '#admin';

  // Load session on mount
  useEffect(() => {
    // Busca a sessão atual (caso a página seja recarregada)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Fica escutando mudanças de autenticação (Ex: Volta do redirecionamento do Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Se o usuário acabou de logar (via Google ou Email), fecha o modal de login automaticamente
      if (event === 'SIGNED_IN') {
        setShowAuth(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Check admin when user changes
  useEffect(() => {
    if (!user || !session?.access_token) {
      setIsAdmin(false);
      return;
    }
    const storedAdmin = window.localStorage.getItem('georgettiAdmin') === 'true';
    if (storedAdmin) {
      setIsAdmin(true);
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

  function getProductStock(product: Product, size: string) {
    return getStockQuantity(product.stock, size);
  }

  // Auth functions
  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    toast.success("Bem-vinda de volta! 💫");
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.user) {
        await signInWithEmail(email, password);
        toast.success("Conta criada com sucesso! ✨");
      } else {
        toast.info("Verifique seu email para confirmar a conta");
      }
    } catch (e: any) {
      throw new Error(e.message || "Erro ao criar conta");
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // 🔥 Isto força o Google a parar e perguntar qual conta usar!
        queryParams: {
          prompt: 'select_account'
        }
      },
    });
    if (error) {
      console.error("Erro no login com Google:", error.message);
      toast.error("Falha ao entrar com Google. Tente novamente.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.localStorage.removeItem('georgettiAdmin');
    setIsAdmin(false);
    if (isAdminRoute) window.location.href = '/';
    toast.success("Até logo!");
  }

  // Cart functions
  function addToCart(product: Product, size: string) {
    const available = getProductStock(product, size);
    if (available <= 0) {
      toast.error("Este tamanho está esgotado!");
      return;
    }
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

  // Admin Panel View
  if (isAdminRoute) {
    if (!session?.access_token) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Toaster position="top-right" richColors />
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <h1 className="text-2xl font-semibold mb-3">Área Admin</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Esta área é exclusiva para administradores. Faça login para continuar.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center justify-center px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-3 inline-flex items-center justify-center px-5 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              Voltar para a loja
            </button>
          </div>
          {showAuth && (
            <AuthModal
              onClose={() => setShowAuth(false)}
              onSignInWithEmail={signInWithEmail}
              onSignUp={signUp}
              onSignInWithGoogle={signInWithGoogle}
            />
          )}
        </div>
      );
    }

    if (isAdmin) {
      return (
        <div className="min-h-screen bg-background">
          <Toaster position="top-right" richColors />
          <AdminPanel accessToken={session.access_token} apiBase={API_BASE} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster position="top-right" richColors />
        <AdminLogin
          apiBase={API_BASE}
          accessToken={session.access_token}
          onSuccess={() => {
            window.localStorage.setItem('georgettiAdmin', 'true');
            setIsAdmin(true);
            toast.success("Acesso admin concedido! 🛡️");
          }}
          onCancel={() => {
            window.location.href = '/';
          }}
        />
      </div>
    );
  }

  // Public Store View
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <Header
        user={user}
        cartCount={cartCount}
        onOpenAuth={() => setShowAuth(true)}
        onOpenCart={() => setShowCart(true)}
        onSignOut={signOut}
      />

      {/* Main content */}
      <main className="pt-16">
        {loadingProducts ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando coleção...</p>
            </div>
          </div>
        ) : (
          <StorePage products={products} onAddToCart={addToCart} apiBase={API_BASE} user={user} />
        )}
      </main>

      {/* Footer */}
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
            </div>
          </div>
        </footer>

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
          onSignInWithEmail={signInWithEmail}
          onSignUp={signUp}
          onSignInWithGoogle={signInWithGoogle}
        />
      )}

      {showCheckout && user && (
        <CheckoutModal
          items={cart}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleCheckout}
        />
      )}

    </div>
  );
}