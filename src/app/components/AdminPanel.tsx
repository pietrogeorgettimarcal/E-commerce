import { useState, useEffect } from "react";
import { Package, ShoppingCart, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, RefreshCw, Tag } from "lucide-react";
import { Product } from "./ProductCard";
import { AdminProductForm } from "./AdminProductForm";

interface AdminPanelProps {
  accessToken: string;
  apiBase: string;
}

const STATUS_OPTIONS = ['pendente', 'confirmado', 'enviado', 'entregue', 'cancelado'];
const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-50 text-yellow-700',
  confirmado: 'bg-blue-50 text-blue-700',
  enviado: 'bg-purple-50 text-purple-700',
  entregue: 'bg-green-50 text-green-700',
  cancelado: 'bg-red-50 text-red-700',
};

export function AdminPanel({ accessToken, apiBase }: AdminPanelProps) {
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${apiBase}/products/all`, { headers });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { console.log('Error fetching products:', e); }
    finally { setLoadingProducts(false); }
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${apiBase}/orders`, { headers });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.reverse() : []);
    } catch (e) { console.log('Error fetching orders:', e); }
    finally { setLoadingOrders(false); }
  }

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [tab]);

  async function toggleVisibility(product: Product) {
    try {
      await fetch(`${apiBase}/products/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ visible: !product.visible }),
      });
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, visible: !p.visible } : p));
    } catch (e) { console.log('Error toggling visibility:', e); }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setDeletingId(id);
    try {
      await fetch(`${apiBase}/products/${id}`, { method: 'DELETE', headers });
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch (e) { console.log('Error deleting product:', e); }
    finally { setDeletingId(null); }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await fetch(`${apiBase}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) { console.log('Error updating order:', e); }
  }

  function handleFormSaved(product: Product, isNew: boolean) {
    if (isNew) setProducts(ps => [product, ...ps]);
    else setProducts(ps => ps.map(p => p.id === product.id ? product : p));
    setShowForm(false);
    setEditingProduct(null);
  }

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus produtos e pedidos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Produtos', value: products.length, icon: <Package className="w-4 h-4" /> },
            { label: 'Visíveis', value: products.filter(p => p.visible).length, icon: <Eye className="w-4 h-4" /> },
            { label: 'Pedidos', value: orders.length, icon: <ShoppingCart className="w-4 h-4" /> },
            { label: 'Receita', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: <Tag className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-accent mb-1">
                {stat.icon}
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <p className="font-['Playfair_Display'] text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-6">
          {(['products', 'orders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t === 'products' ? 'Produtos' : 'Pedidos'}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Playfair_Display'] text-xl font-semibold">Catálogo</h2>
              <div className="flex gap-2">
                <button onClick={fetchProducts} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors" title="Atualizar">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { setEditingProduct(null); setShowForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Produto
                </button>
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-['Playfair_Display'] text-lg text-muted-foreground">Nenhum produto cadastrado</p>
                <button
                  onClick={() => { setEditingProduct(null); setShowForm(true); }}
                  className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                >
                  Adicionar primeiro produto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(product => {
                  const photo = product.photos?.[0];
                  return (
                    <div key={product.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {photo ? (
                          <img src={photo} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{product.category}</span>
                          {!product.visible && (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Oculto</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <span className="font-['Playfair_Display'] font-semibold text-primary">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-muted-foreground">{product.stock} em estoque</span>
                          {product.sizes.length > 0 && (
                            <span className="text-xs text-muted-foreground">{product.sizes.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleVisibility(product)}
                          className={`p-2 rounded-xl transition-colors ${product.visible ? 'hover:bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                          title={product.visible ? 'Ocultar' : 'Mostrar'}
                        >
                          {product.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingProduct(product); setShowForm(true); }}
                          className="p-2 rounded-xl hover:bg-secondary text-foreground transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={deletingId === product.id}
                          className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                          title="Excluir"
                        >
                          {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Playfair_Display'] text-xl font-semibold">Pedidos</h2>
              <button onClick={fetchOrders} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-['Playfair_Display'] text-lg text-muted-foreground">Nenhum pedido ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{order.userEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Playfair_Display'] text-xl font-bold text-primary">
                          R$ {order.total?.toFixed(2).replace('.', ',')}
                        </p>
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="mt-1 text-xs border border-border rounded-lg px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {order.items?.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4 space-y-1">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.name} {item.size && item.size !== 'Único' ? `(${item.size})` : ''} × {item.qty}
                            </span>
                            <span className="font-medium">R$ {(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.address && (
                      <div className="mt-3 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
                        📍 {order.address.street}, {order.address.number} – {order.address.city}/{order.address.state} • {order.paymentMethod?.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <AdminProductForm
          product={editingProduct}
          accessToken={accessToken}
          apiBase={apiBase}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
