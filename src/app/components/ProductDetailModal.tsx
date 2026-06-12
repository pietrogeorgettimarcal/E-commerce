import { useState } from "react";
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "./ProductCard";

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  const photos = product.photos.length > 0 ? product.photos : [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format'
  ];

  function handleAdd() {
    onAddToCart(product, selectedSize);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col sm:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative sm:w-1/2 aspect-square sm:aspect-auto bg-muted flex-shrink-0">
          <img
            src={!imgError ? photos[photoIdx] : photos[0]}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <span className="text-xs font-medium text-accent uppercase tracking-widest">{product.category}</span>
          <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-foreground mt-1">
            {product.name}
          </h2>
          <p className="font-['Playfair_Display'] text-2xl font-bold text-primary mt-2">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{product.description}</p>

          {/* Product Details */}
          {(product.weight || product.productType || product.format || product.material) && (
            <div className="mt-5 grid grid-cols-2 gap-3 p-3.5 bg-muted rounded-lg">
              {product.weight && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Peso</p>
                  <p className="text-sm font-semibold text-foreground">{product.weight}</p>
                </div>
              )}
              {product.productType && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                  <p className="text-sm font-semibold text-foreground">{product.productType}</p>
                </div>
              )}
              {product.format && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Formato</p>
                  <p className="text-sm font-semibold text-foreground">{product.format}</p>
                </div>
              )}
              {product.material && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Material</p>
                  <p className="text-sm font-semibold text-foreground">{product.material}</p>
                </div>
              )}
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-foreground mb-2">
                Tamanho: <span className="text-accent">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedSize === size
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              product.stock > 5
                ? 'bg-green-50 text-green-700'
                : product.stock > 0
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {product.stock > 5 ? 'Em estoque' : product.stock > 0 ? `Últimas ${product.stock} unidades` : 'Esgotado'}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            {product.stock === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </div>
    </div>
  );
}
