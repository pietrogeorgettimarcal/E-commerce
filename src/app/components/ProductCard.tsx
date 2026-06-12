import { ShoppingBag, Heart } from "lucide-react";
import { useState } from "react";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  photos: string[];
  stock: number;
  visible: boolean;
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, size: string) => void;
  onClick: () => void;
}

export function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [imgError, setImgError] = useState(false);

  const photo = !imgError && product.photos[0]
    ? product.photos[0]
    : `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format`;

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
          onClick={e => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
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
        {product.sizes.length > 1 && (
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
        )}

        <div className="flex items-center justify-between">
          <span className="font-['Playfair_Display'] text-lg font-semibold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stock === 0 ? 'Esgotado' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
