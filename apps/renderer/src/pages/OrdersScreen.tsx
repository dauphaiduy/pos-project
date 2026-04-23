import { useEffect, useState } from 'react';
import { useOrderStore } from '../store/orderStore';
import type { Order } from '@pos/shared-types';

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
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (id: number) => void;
  confirming: boolean;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const [askCancel, setAskCancel] = useState(false);
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
  const { orders, isLoading, error, fetchOrders, confirmOrder, cancelOrder } = useOrderStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
          />
        )}
      </div>
    </div>
  );
}
