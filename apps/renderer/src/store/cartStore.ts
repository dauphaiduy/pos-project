import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number; // in cents
  quantity: number;
  note: string;
}

export type PaymentMethod = 'cash' | 'card' | 'qr';

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  addItem: (product: { id: number; name: string; price: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  updateNote: (productId: number, note: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  paymentMethod: 'cash',

  addItem: ({ id, name, price }) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [...s.items, { productId: id, name, price, quantity: 1, note: '' }],
      };
    }),

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

  updateQuantity: (productId, qty) =>
    set((s) => ({
      items:
        qty < 1
          ? s.items.filter((i) => i.productId !== productId)
          : s.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            ),
    })),

  updateNote: (productId, note) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, note } : i
      ),
    })),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  clearCart: () => set({ items: [], paymentMethod: 'cash' }),
}));
