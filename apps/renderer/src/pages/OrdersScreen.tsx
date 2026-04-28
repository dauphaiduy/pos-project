import { useEffect, useState } from 'react';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import type { Order, OrderItem, Product } from '@pos/shared-types';

type Filter = 'all' | 'pending' | 'completed' | 'cancelled';

const formatVND = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵 Tiền mặt',
  card: '💳 Thẻ',
  qr:   '📱 QR',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Chờ xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderDetail({
  order,
  onClose,
  onConfirm,
  confirming,
  onCancel,
  cancelling,
  onSaveItems,
  saving,
  products,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (id: number) => void;
  confirming: boolean;
  onCancel: (id: number) => void;
  cancelling: boolean;
  onSaveItems: (id: number, items: OrderItem[], total: number, payment_method: string) => Promise<void>;
  saving: boolean;
  products: Product[];
}) {
  const [askCancel, setAskCancel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editPayment, setEditPayment] = useState('cash');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  function startEdit() {
    setEditItems(order.items.map((i) => ({ ...i })));
    setEditPayment(order.payment_method);
    setAskCancel(false);
    setShowAddPanel(false);
    setAddSearch('');
    setIsEditing(true);
  }

  function addProduct(p: Product) {
    setEditItems((prev) => {
      const idx = prev.findIndex((i) => i.name === p.name && i.price === p.price);
      if (idx >= 0)
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1, note: '' }];
    });
  }

  function changeQty(idx: number, delta: number) {
    setEditItems((prev) => {
      const newQty = prev[idx].quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      return prev.map((item, i) => i === idx ? { ...item, quantity: newQty } : item);
    });
  }

  const editTotal = editItems.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSave() {
    await onSaveItems(order.id, editItems, editTotal, editPayment);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="order-detail-panel">
        <div className="order-detail-header">
          <div>
            <h3 className="order-detail-title">✏️ Sửa đơn #{order.id}</h3>
            <span className="order-detail-time">Chỉnh sửa mặt hàng và thanh toán</span>
          </div>
          <button className="order-detail-close" onClick={() => setIsEditing(false)} aria-label="Close">✕</button>
        </div>

        <div className="order-edit-items">
          {editItems.length === 0 ? (
            <p className="order-edit-empty">Tất cả mặt hàng đã bị xóa.<br />Nhấn Lưu để xác nhận hoặc Hủy để quay lại.</p>
          ) : (
            <ul className="order-items-list">
              {editItems.map((item, idx) => (
                <li key={idx} className="order-edit-item-row">
                  <div className="order-item-name-wrap">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-note">{formatVND(item.price)} / cái</span>
                  </div>
                  <div className="order-qty-controls">
                    <button className="order-qty-btn" onClick={() => changeQty(idx, -1)}>−</button>
                    <span className="order-qty-val">{item.quantity}</span>
                    <button className="order-qty-btn" onClick={() => changeQty(idx, +1)}>+</button>
                  </div>
                  <span className="order-item-price">{formatVND(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-add-panel">
          <button
            className="order-add-toggle"
            onClick={() => setShowAddPanel((v) => !v)}
          >
            {showAddPanel ? '▲ Ẩn danh sách' : '➕ Thêm sản phẩm'}
          </button>
          {showAddPanel && (
            <div className="order-add-product-list">
              <input
                className="order-add-search"
                placeholder="Tìm sản phẩm…"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                autoFocus
              />
              <div className="order-add-grid">
                {products
                  .filter(
                    (p) =>
                      p.available === 1 &&
                      p.name.toLowerCase().includes(addSearch.toLowerCase()),
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      className="order-add-product-btn"
                      onClick={() => addProduct(p)}
                    >
                      <span className="order-add-product-emoji">{p.emoji || '🛍️'}</span>
                      <span className="order-add-product-name">{p.name}</span>
                      <span className="order-add-product-price">{formatVND(p.price)}</span>
                    </button>
                  ))}
                {products.filter(
                  (p) =>
                    p.available === 1 &&
                    p.name.toLowerCase().includes(addSearch.toLowerCase()),
                ).length === 0 && (
                  <p className="order-add-empty">Không tìm thấy sản phẩm.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="order-edit-payment">
          <p className="order-edit-payment-label">Thanh toán</p>
          <div className="order-edit-payment-options">
            {(['cash', 'card', 'qr'] as const).map((m) => (
              <button
                key={m}
                className={`order-payment-btn${editPayment === m ? ' active' : ''}`}
                onClick={() => setEditPayment(m)}
              >
                {PAYMENT_ICONS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="order-detail-footer">
          <div className="order-detail-total">
            <span>Tổng cộng</span>
            <span className="order-detail-total-amount">{formatVND(editTotal)}</span>
          </div>
          <div className="order-edit-actions">
            <button className="order-edit-cancel-btn" onClick={() => setIsEditing(false)} disabled={saving}>
              Hủy
            </button>
            <button
              className="order-save-btn"
              onClick={handleSave}
              disabled={saving || editItems.length === 0}
            >
              {saving ? 'Đang lưu…' : '✓ Lưu đơn'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-panel">
      <div className="order-detail-header">
        <div>
          <h3 className="order-detail-title">Đơn hàng #{order.id}</h3>
          <span className="order-detail-time">{fmt(order.created_at)}</span>
        </div>
        <button className="order-detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="order-detail-meta">
        <span className={`order-status order-status--${order.status}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
        <span className="order-detail-payment">{PAYMENT_ICONS[order.payment_method] ?? order.payment_method}</span>
      </div>

      <div className="order-detail-items">
        <h4>Sản phẩm</h4>
        {order.items.length === 0 ? (
          <p className="order-detail-no-items">Chưa có thông tin sản phẩm</p>
        ) : (
          <ul className="order-items-list">
            {order.items.map((item, idx) => (
              <li key={idx} className="order-item-row">
                <div className="order-item-name-wrap">
                  <span className="order-item-qty">×{item.quantity}</span>
                  <span className="order-item-name">{item.name}</span>
                  {item.note && <span className="order-item-note">"{item.note}"</span>}
                </div>
                <span className="order-item-price">
                  {formatVND(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-detail-footer">
        <div className="order-detail-total">
          <span>Tổng cộng</span>
          <span className="order-detail-total-amount">{formatVND(order.total)}</span>
        </div>
        {order.status === 'pending' && (
          <button className="order-edit-btn" onClick={startEdit}>
            ✏️ Sửa đơn hàng
          </button>
        )}
        {order.status === 'pending' && (
          <button
            className="confirm-btn confirm-btn--full"
            disabled={confirming || cancelling}
            onClick={() => onConfirm(order.id)}
          >
            {confirming ? 'Đang xử lý…' : '✓ Xác nhận đơn'}
          </button>
        )}
        {order.status === 'pending' && (
          askCancel ? (
            <div className="cancel-confirm-row">
              <span>Hủy đơn này?</span>
              <button
                className="cancel-yes-btn"
                disabled={cancelling}
                onClick={() => { onCancel(order.id); setAskCancel(false); }}
              >
                {cancelling ? '…' : 'Xác nhận hủy'}
              </button>
              <button className="cancel-no-btn" onClick={() => setAskCancel(false)}>Không</button>
            </div>
          ) : (
            <button
              className="cancel-btn cancel-btn--full"
              disabled={confirming || cancelling}
              onClick={() => setAskCancel(true)}
            >
              ✕ Hủy đơn hàng
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function OrdersScreen() {
  const { orders, isLoading, error, fetchOrders, confirmOrder, cancelOrder, editOrderItems } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered: Order[] =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const selectedOrder = selectedId != null ? orders.find((o) => o.id === selectedId) ?? null : null;

  const handleConfirm = async (id: number) => {
    setConfirmingId(id);
    await confirmOrder(id);
    setConfirmingId(null);
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    await cancelOrder(id);
    setCancellingId(null);
  };

  const handleSaveItems = async (id: number, items: OrderItem[], total: number, payment_method: string) => {
    setSavingId(id);
    await editOrderItems(id, items, total, payment_method);
    setSavingId(null);
  };

  return (
    <div className="orders-screen">
      <div className="orders-header">
        <h2>Đơn hàng</h2>
        <div className="orders-filter-tabs">
          {(['all', 'pending', 'completed', 'cancelled'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {{ all: 'Tất cả', pending: 'Chờ xử lý', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-body">
        <div className="orders-list-col">
          {isLoading && <div className="orders-loading">Đang tải…</div>}
          {error     && <div className="orders-error">{error}</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="orders-empty">Chưa có đơn hàng nào.</div>
          )}

          <div className="orders-list">
            {filtered.map((order) => (
              <div
                key={order.id}
                className={`order-card order-card--${order.status}${selectedId === order.id ? ' order-card--selected' : ''}`}
                onClick={() => setSelectedId(selectedId === order.id ? null : order.id)}
              >
                <div className="order-card-left">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-time">{fmtShort(order.created_at)}</span>
                </div>
                <div className="order-card-mid">
                  <span className={`order-status order-status--${order.status}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="order-card-itemcount">
                    {order.items.length > 0
                      ? `${order.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm`
                      : ''}
                  </span>
                </div>
                <div className="order-card-right">
                  <span className="order-total">{formatVND(order.total)}</span>
                  {order.status === 'pending' && (
                    <button
                      className="confirm-btn"
                      disabled={confirmingId === order.id || cancellingId === order.id}
                      onClick={(e) => { e.stopPropagation(); handleConfirm(order.id); }}
                    >
                      {confirmingId === order.id ? '…' : 'Xác nhận'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder && (
          <OrderDetail
            order={selectedOrder}
            onClose={() => setSelectedId(null)}
            onConfirm={handleConfirm}
            confirming={confirmingId === selectedOrder.id}
            onCancel={handleCancel}
            cancelling={cancellingId === selectedOrder.id}
            onSaveItems={handleSaveItems}
            saving={savingId === selectedOrder.id}
            products={products}
          />
        )}
      </div>
    </div>
  );
}
