import { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '../store/orderStore';
import type { Order } from '@pos/shared-types';

type Period = 'today' | 'week' | 'month' | 'all';
type ChartView = 'daily' | 'monthly';

function startOf(period: Period): Date {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

function fmtMoney(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

interface BestSeller {
  name: string;
  qty: number;
  revenue: number;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'week',  label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
  { id: 'all',   label: 'Tất cả' },
];

export function ReportsScreen() {
  const { orders, isLoading, fetchOrders } = useOrderStore();
  const [period, setPeriod] = useState<Period>('month');
  const [chartView, setChartView] = useState<ChartView>('daily');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo((): Order[] => {
    const since = startOf(period);
    return orders.filter((o) => o.status !== 'cancelled' && new Date(o.created_at) >= since);
  }, [orders, period]);

  const completed = useMemo(() => filtered.filter((o) => o.status === 'completed'), [filtered]);

  const totalRevenue  = useMemo(() => completed.reduce((s, o) => s + o.total, 0), [completed]);
  const totalOrders   = filtered.length;
  const completedCount = completed.length;
  const avgOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach((o) => {
      const d = o.created_at.slice(0, 10);
      map[d] = (map[d] ?? 0) + o.total;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [completed]);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach((o) => {
      const m = o.created_at.slice(0, 7);
      map[m] = (map[m] ?? 0) + o.total;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [completed]);

  const chartData  = chartView === 'daily' ? dailyData : monthlyData;
  const maxChartVal = chartData.length > 0 ? Math.max(...chartData.map(([, v]) => v)) : 1;

  const MEDALS = ['🥇', '🥈', '🥉'];

  const bestSellers = useMemo((): BestSeller[] => {
    const map: Record<string, BestSeller> = {};
    completed.forEach((o) => {
      (o.items ?? []).forEach((item) => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty     += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [completed]);

  return (
    <div className="reports-screen">
      {/* ── Header ─────────────────────────────── */}
      <div className="reports-header">
        <div className="reports-header-left">
          <h2>Báo cáo</h2>
          <p>Theo dõi doanh thu và hiệu suất bán hàng</p>
        </div>
        <div className="reports-period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={`filter-tab${period === p.id ? ' active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="orders-loading">Đang tải…</div>}

      {/* ── Stat cards ─────────────────────────── */}
      <div className="reports-stats">
        <div className="stat-card stat-card--green">
          <div className="stat-card-icon-wrap">💰</div>
          <div className="stat-card-body">
            <span className="stat-card-value">{fmtMoney(totalRevenue)}</span>
            <span className="stat-card-label">Doanh thu</span>
          </div>
        </div>
        <div className="stat-card stat-card--blue">
          <div className="stat-card-icon-wrap">📋</div>
          <div className="stat-card-body">
            <span className="stat-card-value">{totalOrders}</span>
            <span className="stat-card-label">Đơn hàng</span>
          </div>
        </div>
        <div className="stat-card stat-card--teal">
          <div className="stat-card-icon-wrap">✅</div>
          <div className="stat-card-body">
            <span className="stat-card-value">{completedCount}</span>
            <span className="stat-card-label">Hoàn thành</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-card-icon-wrap">📈</div>
          <div className="stat-card-body">
            <span className="stat-card-value">{fmtMoney(avgOrderValue)}</span>
            <span className="stat-card-label">Trung bình/đơn</span>
          </div>
        </div>
      </div>

      {/* ── Body: chart + best-sellers ─────────── */}
      <div className="reports-body">
        {/* Revenue bar chart */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <h3 className="reports-section-title">Doanh thu</h3>
            <div className="chart-view-tabs">
              <button
                className={`chart-tab${chartView === 'daily' ? ' active' : ''}`}
                onClick={() => setChartView('daily')}
              >
                Theo ngày
              </button>
              <button
                className={`chart-tab${chartView === 'monthly' ? ' active' : ''}`}
                onClick={() => setChartView('monthly')}
              >
                Theo tháng
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="reports-empty">Không có dữ liệu trong khoảng thời gian này.</div>
          ) : (
            <div className="bar-chart">
              {chartData.map(([label, value]) => (
                <div key={label} className="bar-col">
                  <span className="bar-value">{fmtMoney(value)}</span>
                  <br />
                  <div
                    className="bar"
                    style={{ height: `${Math.max(4, Math.round((value / maxChartVal) * 100))}%` }}
                  />
                  <br />
                  <span className="bar-label">
                    {chartView === 'daily' ? label.slice(5) : label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best-selling products */}
        <div className="reports-bestsellers-card">
          <h3 className="reports-section-title">Sản phẩm bán chạy</h3>
          {bestSellers.length === 0 ? (
            <div className="reports-empty">Chưa có dữ liệu bán hàng.</div>
          ) : (
            <table className="bestsellers-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>SL</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((item, idx) => (
                  <tr key={item.name}>
                    <td className="bs-rank">{MEDALS[idx] ?? idx + 1}</td>
                    <td className="bs-name">{item.name}</td>
                    <td className="bs-qty">{item.qty}</td>
                    <td className="bs-revenue">{fmtMoney(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
