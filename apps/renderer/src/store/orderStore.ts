import { create } from 'zustand';
import type { Order, CreateOrderInput, OrderItem } from '@pos/shared-types';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addOrder: (input: CreateOrderInput) => Promise<void>;
  confirmOrder: (id: number) => Promise<void>;
  cancelOrder: (id: number) => Promise<void>;
  editOrderItems: (id: number, items: OrderItem[], total: number, payment_method: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await window.electronAPI.listOrders();
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addOrder: async (input: CreateOrderInput) => {
    set({ isLoading: true, error: null });
    try {
      const order = await window.electronAPI.createOrder(input);
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
      }));
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  confirmOrder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await window.electronAPI.updateOrderStatus({ id, status: 'completed' });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  cancelOrder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await window.electronAPI.updateOrderStatus({ id, status: 'cancelled' });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  editOrderItems: async (id: number, items: OrderItem[], total: number, payment_method: string) => {
    try {
      const updated = await window.electronAPI.updateOrderItems({ id, items, total, payment_method });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
      }));
    } catch (err) {
      set({ error: String(err) });
    }
  },
}));
