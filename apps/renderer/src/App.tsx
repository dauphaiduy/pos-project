import { useState } from 'react';
import { POSScreen }      from './pages/POSScreen';
import { OrdersScreen }   from './pages/OrdersScreen';
import { ProductsScreen } from './pages/ProductsScreen';
import { ReportsScreen }  from './pages/ReportsScreen';
import './App.css';

type Page = 'pos' | 'orders' | 'products' | 'reports';

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'pos',      label: 'Bán hàng',   icon: '🏪' },
  { id: 'orders',   label: 'Đơn hàng',  icon: '📋' },
  { id: 'products', label: 'Sản phẩm',  icon: '🍵' },
  { id: 'reports',  label: 'Báo cáo',   icon: '📊' },
];

export default function App() {
  const [page, setPage] = useState<Page>('pos');

  const renderPage = () => {
    switch (page) {
      case 'pos':      return <POSScreen onOrderPlaced={() => setPage('orders')} />;
      case 'orders':   return <OrdersScreen />;
      case 'products': return <ProductsScreen />;
      case 'reports':  return <ReportsScreen />;
    }
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">☕ POS</div>
        <ul className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="page-content">
        {renderPage()}
      </div>
    </div>
  );
}
