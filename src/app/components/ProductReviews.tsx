import { useState, useEffect } from "react";
import { Star, User, BadgeCheck, Filter, Lock, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { toast } from "sonner";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

interface Review {
  id: string;
  user_id: string; // Adicionado para sabermos de quem é o comentário
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string | number;
  onStatsUpdate?: (average: number, count: number) => void;
}

export function ProductReviews({ productId, onStatsUpdate }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Lógica de Filtro e Compra Verificada
  const [filter, setFilter] = useState<number>(0);
  const [canReview, setCanReview] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  // Lógica de Edição
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      setUser(currentUser);
      
      await fetchReviews();

      if (currentUser) {
        verifyPurchase(currentUser.id);
      } else {
        setCheckingPurchase(false);
      }
    }
    init();
  }, [productId]);

  async function verifyPurchase(userId: string) {
    try {
      const { data: orders } = await supabase.from("orders").select("items").eq("user_id", userId);
      if (orders) {
        const hasBought = orders.some(order => {
          const itemsArray = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          return itemsArray?.some((item: any) => item.productId === productId);
        });
        setCanReview(hasBought);
      }
    } catch (e) {
      console.log("Erro ao verificar compra", e);
    } finally {
      setCheckingPurchase(false);
    }
  }

  async function fetchReviews() {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
      if (onStatsUpdate) {
        const avg = data.length > 0 ? data.reduce((acc, curr) => acc + curr.rating, 0) / data.length : 0;
        onStatsUpdate(Number(avg.toFixed(1)), data.length);
      }
    }
  }

  // --- FUNÇÕES DE CRIAR, EDITAR E EXCLUIR ---

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!canReview) return toast.error("Apenas clientes que compraram este produto podem avaliar!");
    if (newComment.trim().length < 5) return toast.error("Escreva um comentário mais detalhado.");

    setIsSubmitting(true);
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente";

    const { error } = await supabase.from("reviews").insert([{
      product_id: productId,
      user_id: user.id,
      user_name: userName,
      rating: rating,
      comment: newComment,
    }]);

    setIsSubmitting(false);

    if (error) {
      toast.error(`Erro ao enviar: ${error.message}`);
    } else {
      toast.success("Avaliação enviada com sucesso! ⭐");
      setNewComment("");
      setRating(5);
      fetchReviews();
    }
  }

  function startEditing(review: Review) {
    setEditingReviewId(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  }

  async function handleUpdateReview(e: React.FormEvent) {
    e.preventDefault();
    if (editComment.trim().length < 5) return toast.error("Escreva um comentário mais detalhado.");
    
    setIsUpdating(true);
    const { error } = await supabase.from('reviews')
      .update({ rating: editRating, comment: editComment })
      .eq('id', editingReviewId);

    setIsUpdating(false);

    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    } else {
      toast.success("Avaliação atualizada com sucesso! ✨");
      setEditingReviewId(null);
      fetchReviews();
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!window.confirm("Tem certeza que deseja excluir a sua avaliação?")) return;

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      toast.error("Erro ao excluir avaliação.");
    } else {
      toast.success("Avaliação excluída.");
      fetchReviews();
    }
  }

  // --- CÁLCULOS ESTATÍSTICOS ---
  const totalReviews = reviews.length;
  const media = totalReviews > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) : "0.0";
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (distribution[r.rating as keyof typeof distribution] !== undefined) distribution[r.rating as keyof typeof distribution]++ });

  const filteredReviews = filter === 0 ? reviews : reviews.filter(r => r.rating === filter);

  return (
    <div className="bg-card">
      <h2 className="text-3xl font-semibold text-foreground mb-10 font-['Playfair_Display']">Opiniões dos Consumidores</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* LADO ESQUERDO: RESUMO E BARRAS */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-7xl font-light text-foreground tracking-tighter">{media}</span>
            <div className="flex flex-col">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(media)) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground mt-1">{totalReviews} avaliações no total</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/50 pt-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as keyof typeof distribution];
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm cursor-pointer group" onClick={() => setFilter(filter === star ? 0 : star)}>
                  <span className="w-16 text-muted-foreground group-hover:text-primary transition">{star} estrelas</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
          
          {filter !== 0 && (
            <button onClick={() => setFilter(0)} className="mt-4 text-sm text-primary underline text-left">
              Limpar filtro (Mostrando apenas {filter} estrelas)
            </button>
          )}
        </div>

        {/* LADO DIREITO: FORMULÁRIO E LISTA DE COMENTÁRIOS */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* Caixa de Escrever Avaliação Nova */}
          <div className="mb-10">
            {!user ? (
              <div className="bg-muted/50 border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                <h3 className="font-medium text-foreground">Faça login para avaliar</h3>
                <p className="text-sm text-muted-foreground mt-1">Apenas clientes logados podem deixar a sua opinião.</p>
              </div>
            ) : checkingPurchase ? (
              <p className="text-sm text-muted-foreground animate-pulse">A verificar permissão de avaliação...</p>
            ) : canReview ? (
              <form onSubmit={handleSubmitReview} className="bg-muted/30 p-6 rounded-xl border border-border shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Como avalia a sua compra?</h3>
                <div className="flex items-center mb-5 gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-white text-gray-300"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  placeholder="Conte para nós e para outros clientes o que achou do produto..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-4 border border-border rounded-xl bg-card focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                />
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition shadow-sm disabled:opacity-50">
                    {isSubmitting ? "A enviar..." : "Publicar Avaliação"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 flex items-start gap-4 text-left">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-1"><BadgeCheck className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-semibold text-orange-900">Compra não verificada</h3>
                  <p className="text-sm text-orange-800/80 mt-1">Para garantir a autenticidade das opiniões, apenas clientes que compraram e receberam este produto podem avaliá-lo.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" /> Comentários {filter !== 0 ? `de ${filter} estrelas` : 'Recentes'}
            </h3>
          </div>

          {/* LISTAGEM DE AVALIAÇÕES COM EDIÇÃO INLINE */}
          <div className="space-y-8">
            {filteredReviews.length === 0 ? (
              <p className="text-gray-500 italic">Não existem avaliações com este filtro.</p>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-border/40 last:border-0">
                  
                  {/* Se estiver no MODO DE EDIÇÃO para esta avaliação */}
                  {editingReviewId === review.id ? (
                    <form onSubmit={handleUpdateReview} className="bg-muted/40 p-5 rounded-xl border border-primary/30">
                      <h4 className="text-sm font-semibold mb-3 text-primary">A editar avaliação...</h4>
                      <div className="flex items-center mb-3 gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setEditRating(star)}
                            onMouseEnter={() => setEditHoverRating(star)}
                            onMouseLeave={() => setEditHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 ${star <= (editHoverRating || editRating) ? "fill-yellow-400 text-yellow-400" : "fill-white text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-card focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                      />
                      <div className="flex justify-end mt-3 gap-3">
                        <button type="button" onClick={() => setEditingReviewId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition">
                          Cancelar
                        </button>
                        <button type="submit" disabled={isUpdating} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50">
                          {isUpdating ? "A guardar..." : "Salvar Alterações"}
                        </button>
                      </div>
                    </form>

                  ) : (
                    /* MODO DE LEITURA NORMAL */
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-white text-gray-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <p className="text-foreground leading-relaxed text-base">{review.comment}</p>
                      
                      <div className="flex items-center mt-4 text-sm text-muted-foreground gap-2">
                        <div className="bg-muted p-1.5 rounded-full"><User className="w-3.5 h-3.5 text-gray-500" /></div>
                        <span className="font-medium text-gray-700">{review.user_name}</span>
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs ml-2 border border-green-100">
                          <BadgeCheck className="w-3 h-3" /> Compra Verificada
                        </span>
                      </div>

                      {/* Botões de Ação (Aparecem só se for o dono do comentário) */}
                      {user && user.id === review.user_id && (
                        <div className="flex items-center gap-4 mt-5 pt-3 border-t border-border/30">
                          <button 
                            onClick={() => startEditing(review)} 
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar Avaliação
                          </button>
                          <button 
                            onClick={() => handleDeleteReview(review.id)} 
                            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}