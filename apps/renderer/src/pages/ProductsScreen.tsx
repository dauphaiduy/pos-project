import { useEffect, useState } from 'react';
import { useProductStore } from '../store/productStore';
import type { Product, CreateProductInput } from '@pos/shared-types';

const CATEGORIES = ['Coffee', 'Tea', 'Juice', 'Food'];
const CATEGORY_FILTERS = ['Tất cả', ...CATEGORIES];

const EMPTY_FORM: CreateProductInput = {
  name: '',
  price: 0,
  category: 'Coffee',
  emoji: '',
  available: 1,
};

type FormState = CreateProductInput & { id?: number };

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const set = (field: keyof FormState, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h3 className="product-form-title">{initial.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h3>

      <label className="product-form-label">
        Tên
        <input
          className="product-form-input"
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="vd. Cà phê sữa"
          required
          maxLength={60}
        />
      </label>

      <div className="product-form-row">
        <label className="product-form-label">
          Price (₫)
          <input
            className="product-form-input"
            type="number"
            min="1000"
            step="1000"
            value={form.price || ''}
            onChange={(e) => set('price', parseInt(e.target.value || '0', 10))}
            placeholder="35000"
            required
          />
        </label>
        <label className="product-form-label">
          Emoji
          <input
            className="product-form-input product-form-emoji"
            type="text"
            value={form.emoji ?? ''}
            onChange={(e) => set('emoji', e.target.value)}
            placeholder="☕"
            maxLength={4}
          />
        </label>
      </div>

      <label className="product-form-label">
        Category
        <select
          className="product-form-input"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="product-form-label product-form-label--row">
        <span>Còn hàng</span>
        <button
          type="button"
          className={`toggle-btn${form.available ? ' toggle-btn--on' : ''}`}
          onClick={() => set('available', form.available ? 0 : 1)}
        >
          {form.available ? 'Có' : 'Không'}
        </button>
      </label>

      {error && <p className="product-form-error">{error}</p>}

      <div className="product-form-actions">
        <button type="button" className="product-form-cancel" onClick={onCancel}>Hủy</button>
        <button type="submit" className="product-form-save" disabled={saving}>
          {saving ? 'Đang lưu…' : initial.id ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  product,
  onConfirm,
  onCancel,
  deleting,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="delete-confirm">
      <p>Xóa <strong>{product.emoji} {product.name}</strong>?</p>
      <p className="delete-confirm-sub">Hành động này không thể hoàn tác.</p>
      <div className="delete-confirm-actions">
        <button className="product-form-cancel" onClick={onCancel}>Hủy</button>
        <button className="delete-confirm-yes" disabled={deleting} onClick={onConfirm}>
          {deleting ? 'Đang xóa…' : 'Xóa'}
        </button>
      </div>
    </div>
  );
}

export function ProductsScreen() {
  const { products, isLoading, error, fetchProducts, addProduct, editProduct, removeProduct, toggleAvailable } =
    useProductStore();

  const [filter, setFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<'none' | 'add' | 'edit' | 'delete'>('none');
  const [target, setTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const visible = products.filter((p) => {
    const matchCat = filter === 'Tất cả' || p.category === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd = () => { setTarget(null); setFormError(null); setPanel('add'); };
  const openEdit = (p: Product) => { setTarget(p); setFormError(null); setPanel('edit'); };
  const openDelete = (p: Product) => { setTarget(p); setPanel('delete'); };
  const closePanel = () => { setPanel('none'); setTarget(null); };

  const handleSave = async (data: FormState) => {
    setSaving(true);
    setFormError(null);
    try {
      if (data.id) {
        await editProduct({ id: data.id, name: data.name, price: data.price, category: data.category, emoji: data.emoji, available: data.available });
      } else {
        await addProduct(data);
      }
      closePanel();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    await removeProduct(target.id);
    setDeleting(false);
    closePanel();
  };

  const grouped = CATEGORIES.filter((c) => filter === 'Tất cả' || c === filter).map((cat) => ({
    cat,
    items: visible.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="products-screen">
      {/* ── Header ─────────────────────────────── */}
      <div className="products-header">
        <h2>Sản phẩm</h2>
        <button className="add-product-btn" onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      {/* ── Toolbar ────────────────────────────── */}
      <div className="products-toolbar">
        <div className="products-filter-tabs">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="products-search"
          type="text"
          placeholder="Tìm kiếm sản phẩm…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <div className="orders-loading">Đang tải…</div>}
      {error     && <div className="orders-error">{error}</div>}

      {/* ── Product list ───────────────────────── */}
      <div className="products-body">
        <div className="products-list-col">
          {grouped.length === 0 && !isLoading && (
            <div className="orders-empty">Không tìm thấy sản phẩm.</div>
          )}
          {grouped.map(({ cat, items }) => (
            <div key={cat} className="products-group">
              <h3 className="products-group-title">{cat}</h3>
              <div className="products-grid">
                {items.map((p) => (
                  <div key={p.id} className={`product-mgmt-card${p.available ? '' : ' product-mgmt-card--oos'}`}>
                    <div className="product-mgmt-top">
                      <span className="product-mgmt-emoji">{p.emoji || '📦'}</span>
                      <div className="product-mgmt-info">
                        <span className="product-mgmt-name">{p.name}</span>
                        <span className="product-mgmt-price">{p.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <button
                        className={`toggle-btn toggle-btn--sm${p.available ? ' toggle-btn--on' : ''}`}
                        onClick={() => toggleAvailable(p.id, p.available ? 0 : 1)}
                        title={p.available ? 'Đánh dấu hết hàng' : 'Đánh dấu còn hàng'}
                      >
                        {p.available ? 'Còn hàng' : 'Hết hàng'}
                      </button>
                    </div>
                    <div className="product-mgmt-actions">
                      <button className="product-action-edit" onClick={() => openEdit(p)}>Sửa</button>
                      <button className="product-action-delete" onClick={() => openDelete(p)}>Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Side panel ─────────────────────────── */}
        {panel !== 'none' && (
          <div className="products-side-panel">
            {(panel === 'add' || panel === 'edit') && (
              <ProductForm
                initial={panel === 'edit' && target
                  ? { id: target.id, name: target.name, price: target.price, category: target.category, emoji: target.emoji, available: target.available }
                  : { ...EMPTY_FORM }}
                onSave={handleSave}
                onCancel={closePanel}
                saving={saving}
                error={formError}
              />
            )}
            {panel === 'delete' && target && (
              <DeleteConfirm
                product={target}
                onConfirm={handleDelete}
                onCancel={closePanel}
                deleting={deleting}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

