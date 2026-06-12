import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { ProductCard, Product } from "./ProductCard";
import { ProductDetailModal } from "./ProductDetailModal";

interface StorePageProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
}

const CATEGORIES = ['Todos', 'Colares', 'Brincos', 'Anéis', 'Pulseiras', 'Tornozeleiras', 'Conjuntos'];

export function StorePage({ products, onAddToCart }: StorePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.visible);
    if (category !== 'Todos') list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, search, sortBy]);

  const heroPhoto = 'https://images.unsplash.com/photo-1569397288884-4d43d6738fbd?w=1400&h=600&fit=crop&auto=format';

  return (
    <>
      {/* Hero */}
      <section className="relative h-80 sm:h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroPhoto})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 max-w-7xl mx-auto">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">Coleção 2025</p>
          <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl font-bold text-white leading-tight max-w-lg">
            Bijuterias que contam histórias
          </h1>
          <p className="text-white/80 mt-3 text-base max-w-sm">
            Peças únicas, feitas com cuidado para realçar sua beleza.
          </p>
          <button
            onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-6 self-start px-6 py-2.5 bg-accent text-accent-foreground rounded-full font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            Ver Coleção
          </button>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                category === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search and sort */}
        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar bijuterias..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Ordenar</span>
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-4 bg-card rounded-xl border border-border flex gap-2 flex-wrap">
            {([
              { label: 'Mais recentes', value: 'newest' },
              { label: 'Menor preço', value: 'price-asc' },
              { label: 'Maior preço', value: 'price-desc' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSortBy(opt.value); setShowFilters(false); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  sortBy === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="mt-5 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'} encontrados
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="font-['Playfair_Display'] text-xl text-muted-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">Tente outra busca ou categoria</p>
          </div>
        )}
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
