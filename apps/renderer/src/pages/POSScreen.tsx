import { useEffect, useMemo, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';

const formatVND = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

const PAYMENT_METHODS = [
  { id: 'cash' as const, label: 'Cash', icon: '💵' },
  { id: 'card' as const, label: 'Card', icon: '💳' },
  { id: 'qr'   as const, label: 'QR',   icon: '📱' },
];

export function POSScreen({ onOrderPlaced }: { onOrderPlaced?: () => void }) {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const {
    items, paymentMethod,
    addItem, removeItem, updateQuantity, updateNote,
    setPaymentMethod, clearCart,
  } = useCartStore();
  const { addOrder, isLoading, error } = useOrderStore();
  const { products, fetchProducts } = useProductStore();

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const availableProducts = useMemo(() => products.filter((p) => p.available), [products]);

  const categories = useMemo(() => {
    const cats = [...new Set(availableProducts.map((p) => p.category))];
    return ['Tất cả', ...cats];
  }, [availableProducts]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const filteredProducts =
    activeCategory === 'Tất cả'
      ? availableProducts
      : availableProducts.filter((p) => p.category === activeCategory);

  const handleCompleteOrder = async () => {
    if (items.length === 0 || isLoading) return;
    await addOrder({
      total,
      status: 'pending',
      payment_method: 'cash',
      items: items.map(({ productId, name, price, quantity, note }) => ({
        productId, name, price, quantity, note,
      })),
    });
    clearCart();
    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
    //   onOrderPlaced?.();
    }, 1200);
  };

  return (
    <div className="pos-screen">
      {/* ── Left: Product catalog ─────────────────── */}
      <div className="pos-products">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map((p) => {
            const inCart = items.find((i) => i.productId === p.id);
            return (
              <button
                key={p.id}
                className={`product-card${inCart ? ' in-cart' : ''}`}
                onClick={() => addItem(p)}
              >
                {inCart && <span className="product-badge">{inCart.quantity}</span>}
                <span className="product-emoji">{p.emoji}</span>
                <span className="product-name">{p.name}</span>
                <span className="product-price">{formatVND(p.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Cart ───────────────────────────── */}
      <div className="pos-cart">
        <div className="cart-header">
          <h2>Đơn hiện tại</h2>
          {items.length > 0 && (
            <button className="cart-clear" onClick={clearCart}>
              Xóa
            </button>
          )}
        </div>

        {orderSuccess ? (
          <div className="order-success">
            <span className="success-icon">✅</span>
            <p>Đặt hàng thành công!</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">Chọn sản phẩm để thêm vào đơn</div>
        ) : (
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-top">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-subtotal">
                    {formatVND(item.price * item.quantity)}
                  </span>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Xóa sản phẩm"
                  >
                    ✕
                  </button>
                </div>
                <div className="cart-item-bottom">
                  <div className="qty-control">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <input
                    className="note-input"
                    type="text"
                    placeholder="Ghi chú…"
                    value={item.note}
                    onChange={(e) => updateNote(item.productId, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-footer">
          <div className="cart-total-row">
            <span>Tổng cộng</span>
            <span className="cart-total-amount">{formatVND(total)}</span>
          </div>

          {/* <div className="payment-methods">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                className={`payment-btn${paymentMethod === m.id ? ' active' : ''}`}
                onClick={() => setPaymentMethod(m.id)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div> */}

          {error && <p className="cart-error">{error}</p>}

          <button
            className="complete-btn"
            disabled={items.length === 0 || isLoading || orderSuccess}
            onClick={handleCompleteOrder}
          >
            {isLoading
              ? 'Đang xử lý…'
              : `Thanh toán · ${formatVND(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
