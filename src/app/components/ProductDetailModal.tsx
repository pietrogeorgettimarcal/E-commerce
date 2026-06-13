import { useState, useRef } from "react";
import { X, ShoppingBag, ChevronLeft, ChevronRight, Scale, PackageSearch, Gem, Truck, Heart, Star } from "lucide-react";
import { Product } from "./ProductCard";
import { formatarPreco, getStockQuantity } from "./ui/utils";
import { ProductReviews } from './ProductReviews';

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
  user: any | null;
}

export function ProductDetailModal({ product, onClose, onAddToCart, user }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  
  // Estado para receber as médias reais do componente de reviews
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  
  // Referência para fazer a rolagem suave até as avaliações
  const reviewsRef = useRef<HTMLDivElement>(null);

  const stockAvailable = getStockQuantity(product.stock, selectedSize);
  const photos = product.photos && product.photos.length > 0 ? product.photos : [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format'
  ];

  function handleAdd() {
    onAddToCart(product, selectedSize);
    onClose();
  }

  function scrollToReviews() {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const DetailSection = ({ icon: Icon, title, children }: any) => (
    <details className="group border-b border-border last:border-0" open>
      <summary className="flex items-center justify-between py-5 cursor-pointer list-none outline-none">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-6 pl-8 text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-3">
        {children}
      </div>
    </details>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 md:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
      
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col scroll-smooth"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-muted hover:bg-gray-200 transition-colors z-50"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="p-6 sm:p-10">
          <div className="flex flex-col md:flex-row gap-10 lg:gap-14">
            
            {/* Lado Esquerdo: Galeria */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden group border border-border/50">
                <img
                  src={!imgError ? photos[photoIdx] : photos[0]}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition hover:scale-110 shadow-sm z-10">
                  <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
                
                {photos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition">
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition">
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {photos.map((foto, i) => (
                    <button 
                      key={i} 
                      onClick={() => setPhotoIdx(i)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === photoIdx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={foto} alt={`Miniatura ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lado Direito: Informações */}
            <div className="w-full md:w-1/2 flex flex-col">
              <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">{product.category}</span>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                {product.name}
              </h2>
              
              {/* 🔥 ESTRELAS REAIS LIGADAS À BASE DE DADOS E BOTÃO DE DESCER 🔥 */}
              <div className="flex items-center gap-2 mt-3 mb-6">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.round(reviewStats.average) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                      />
                    ))}
                  </div>
                  <span 
                    onClick={scrollToReviews} 
                    className="text-sm text-muted-foreground underline cursor-pointer hover:text-primary transition"
                  >
                    ({reviewStats.average} / 5.0) - {reviewStats.count} avaliações
                  </span>
              </div>

              <p className="font-['Playfair_Display'] text-4xl font-bold text-foreground mt-2 mb-8">
                {formatarPreco(product.price)}
                <span className="block text-sm font-normal text-muted-foreground mt-2">em até 10x sem juros no cartão</span>
              </p>

              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-medium text-foreground mb-3 uppercase tracking-wider">
                    Tamanho selecionado: <span className="font-bold">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 rounded-full text-sm font-medium border-2 transition-all flex items-center justify-center ${
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground shadow-md scale-110'
                            : 'border-border text-foreground hover:border-primary/50 hover:bg-muted'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-border">
                <div className="mb-4">
                  <span className={`text-sm font-semibold flex items-center gap-2 ${
                    stockAvailable > 5 ? 'text-green-600' : 
                    stockAvailable > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${stockAvailable > 0 ? (stockAvailable > 5 ? 'bg-green-600' : 'bg-yellow-600') : 'bg-red-600'} animate-pulse`} />
                    {stockAvailable === 0 ? 'Produto Esgotado' : `Disponível em estoque (${stockAvailable} unidades)`}
                  </span>
                </div>
                
                <button
                  onClick={handleAdd}
                  disabled={stockAvailable === 0}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <ShoppingBag className="w-6 h-6" />
                  {stockAvailable === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t-2 border-border/60">
            <div className="max-w-4xl mx-auto space-y-2 mb-16">
              <DetailSection icon={PackageSearch} title="Descrição do Produto">
                <p className="text-base">{product.description}</p>
              </DetailSection>
              
              {(product.weight || product.productType || product.format || product.material) && (
                <DetailSection icon={Scale} title="Ficha Técnica">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 bg-muted/50 p-6 rounded-xl">
                    {product.weight && <div className="flex justify-between border-b border-border/50 pb-2"><strong className="text-foreground">Peso</strong> <span>{product.weight.toString().replace('.', ',')}g</span></div>}
                    {product.productType && <div className="flex justify-between border-b border-border/50 pb-2"><strong className="text-foreground">Tipo</strong> <span>{product.productType}</span></div>}
                    {product.format && <div className="flex justify-between border-b border-border/50 pb-2"><strong className="text-foreground">Formato</strong> <span>{product.format}</span></div>}
                    {product.material && <div className="flex justify-between border-b border-border/50 pb-2"><strong className="text-foreground">Material</strong> <span>{product.material}</span></div>}
                  </div>
                </DetailSection>
              )}
            </div>

            {/* 🔥 REFERÊNCIA PARA ROLAGEM AQUI 🔥 */}
            <div ref={reviewsRef} className="max-w-5xl mx-auto bg-card rounded-2xl">
              <ProductReviews 
                productId={product.id} 
                onStatsUpdate={(avg, count) => setReviewStats({ average: avg, count: count })}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}