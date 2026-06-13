import { ShoppingBag, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { formatarPreco, getStockQuantity } from "./ui/utils";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { toast } from "sonner";
import { ProductReviews } from './ProductReviews';

// Configuração do Supabase para falar com a base de dados
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  photos: string[];
  stock: number | Record<string, number>;
  visible: boolean;
  createdAt: string;
  weight?: string;
  productType?: string;
  format?: string;
  material?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, size: string) => void;
  onClick: () => void;
}

export function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [imgError, setImgError] = useState(false);

  const stockAvailable = getStockQuantity(product.stock, selectedSize);

  const photo = !imgError && product.photos && product.photos[0]
    ? product.photos[0]
    : `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format`;

  // 1. Verifica se o produto já está nos favoritos ao carregar a página
  useEffect(() => {
    async function checkFavoriteStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Se não estiver logado, ignora

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .single();

      if (data) {
        setLiked(true); // Já tinha salvo antes, deixa o coração vermelho!
      }
    }
    
    checkFavoriteStatus();
  }, [product.id]);

  // 2. Função real para guardar ou remover o coração na Base de Dados
  async function handleToggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLoadingLike(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast.error("Tem de fazer login para guardar os seus favoritos! 🔒");
      setLoadingLike(false);
      return;
    }

    const userId = session.user.id;

    // 🔥 Adicionamos uma verificação de segurança no código
    if (!product.id) {
      toast.error("Erro: O ID deste produto não foi encontrado.");
      setLoadingLike(false);
      return;
    }

    if (liked) {
      // Descurtir
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', product.id);

      if (!error) {
        setLiked(false);
        toast.success("Produto removido dos favoritos.");
      } else {
        console.error("Erro Supabase Delete:", error);
        toast.error(`Erro ao remover: ${error.message}`);
      }
    } else {
      // Curtir
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, product_id: product.id }]);

      if (!error) {
        setLiked(true);
        toast.success("Guardado nos seus favoritos! ❤️");
      } else {
        console.error("Erro Supabase Insert:", error);
        // 🔥 Isto vai mostrar o erro exato na sua tela
        toast.error(`Erro ao guardar: ${error.message}`);
      }
    }
    
    setLoadingLike(false);
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
  }

  return (
    <div
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={photo}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={handleToggleLike}
          disabled={loadingLike}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`} />
        </button>
        <div className="absolute top-3 left-3">
          <span className="bg-card/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-muted-foreground font-medium">
            {product.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-['Playfair_Display'] font-semibold text-foreground text-base leading-snug">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{product.description}</p>
        </div>

        {/* Sizes */}
        {product.sizes && product.sizes.length > 1 && (
          <>
            <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedSize === size
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stockAvailable > 5
                ? `Tamanho ${selectedSize}: Em estoque`
                : stockAvailable > 0
                ? `Tamanho ${selectedSize}: ${stockAvailable} unid.`
                : 'Tamanho selecionado esgotado'}
            </p>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="font-['Playfair_Display'] text-lg font-semibold text-primary">
            {formatarPreco(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={stockAvailable === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {stockAvailable === 0 ? 'Esgotado' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}