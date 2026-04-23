import { useEffect } from 'react';
import { useOrderStore } from '../store/orderStore';

export function OrderList() {
  const { orders, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="order-list">
      <h2>Orders</h2>
      {isLoading && <p className="loading">Loading…</p>}
      {!isLoading && orders.length === 0 && <p className="empty">No orders yet.</p>}
      {orders.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.total.toLocaleString('vi-VN')} ₫</td>
                <td>
                  <span className={`status status--${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
