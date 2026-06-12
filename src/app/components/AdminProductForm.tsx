import { useState, useRef } from "react";
import { X, Plus, Trash2, Upload, Link, Loader2, Image } from "lucide-react";
import { Product } from "./ProductCard";

interface AdminProductFormProps {
  product: Product | null;
  accessToken: string;
  apiBase: string;
  onClose: () => void;
  onSaved: (product: Product, isNew: boolean) => void;
}

const CATEGORIES = ['Colares', 'Brincos', 'Anéis', 'Pulseiras', 'Tornozeleiras', 'Conjuntos', 'Geral'];

export function AdminProductForm({ product, accessToken, apiBase, onClose, onSaved }: AdminProductFormProps) {
  const isNew = !product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    category: product?.category || 'Colares',
    sizes: product?.sizes || [] as string[],
    photos: product?.photos || [] as string[],
    stock: product?.stock?.toString() || '0',
    visible: product?.visible ?? true,
    weight: product?.weight || '',
    productType: product?.productType || '',
    format: product?.format || '',
    material: product?.material || '',
  });
  const [newSize, setNewSize] = useState('');

  const headers = { 'Authorization': `Bearer ${accessToken}` };

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${apiBase}/upload`, { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no upload');
      setForm(f => ({ ...f, photos: [...f.photos, data.url] }));
    } catch (e: any) {
      setError(`Erro no upload: ${e.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function addPhotoUrl() {
    if (!urlInput.trim()) return;
    setForm(f => ({ ...f, photos: [...f.photos, urlInput.trim()] }));
    setUrlInput('');
    setShowUrlInput(false);
  }

  function removePhoto(idx: number) {
    setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  }

  function addSize() {
    const s = newSize.trim();
    if (!s || form.sizes.includes(s)) return;
    setForm(f => ({ ...f, sizes: [...f.sizes, s] }));
    setNewSize('');
  }

  function removeSize(s: string) {
    setForm(f => ({ ...f, sizes: f.sizes.filter(x => x !== s) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Digite o nome do produto'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('Digite um preço válido'); return; }
    setLoading(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        sizes: form.sizes,
        photos: form.photos,
        stock: Number(form.stock) || 0,
        visible: form.visible,
        weight: form.weight.trim(),
        productType: form.productType.trim(),
        format: form.format.trim(),
        material: form.material.trim(),
      };
      const url = isNew ? `${apiBase}/products` : `${apiBase}/products/${product!.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      onSaved(data, isNew);
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background rounded-xl text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-['Playfair_Display'] text-xl font-semibold">
            {isNew ? 'Novo Produto' : 'Editar Produto'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Fotos do produto</label>
              <div className="flex gap-2 flex-wrap">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop'; }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded">capa</span>
                    )}
                  </div>
                ))}

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-[10px]">Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }}
                />

                {/* URL button */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Link className="w-5 h-5" />
                  <span className="text-[10px]">URL</span>
                </button>
              </div>

              {showUrlInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    className={inputCls + " flex-1"}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhotoUrl())}
                  />
                  <button type="button" onClick={addPhotoUrl} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do produto"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                className={inputCls + " resize-none"}
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o produto..."
              />
            </div>

            {/* Price, Stock, Category */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estoque</label>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Weight, Type, Format, Material */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Peso (g)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="Ex: 50g, 100g"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Produto</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.productType}
                  onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                  placeholder="Ex: Colar, Brinco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Formato</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                  placeholder="Ex: Redondo, Quadrado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material Utilizado</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.material}
                  onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                  placeholder="Ex: Ouro, Prata, Aço"
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium mb-2">Tamanhos / Medidas</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.sizes.map(s => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {s}
                    <button type="button" onClick={() => removeSize(s)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputCls + " flex-1"}
                  value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  placeholder="Ex: P, M, G ou 40cm, 16..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                />
                <button type="button" onClick={addSize} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Pressione Enter ou clique + para adicionar cada tamanho</p>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Visível no catálogo</p>
                <p className="text-xs text-muted-foreground">Clientes poderão ver este produto</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.visible ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.visible ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isNew ? 'Criar Produto' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
