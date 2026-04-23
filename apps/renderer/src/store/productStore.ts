import { create } from 'zustand';
import type { Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (input: CreateProductInput) => Promise<Product>;
  editProduct: (input: UpdateProductInput) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  toggleAvailable: (id: number, available: number) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await window.electronAPI.listProducts();
      set({ products, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  addProduct: async (input: CreateProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const product = await window.electronAPI.createProduct(input);
      set((state) => ({ products: [...state.products, product], isLoading: false }));
      return product;
    } catch (err) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  editProduct: async (input: UpdateProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await window.electronAPI.updateProduct(input);
      set((state) => ({
        products: state.products.map((p) => (p.id === input.id ? updated : p)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: String(err), isLoading: false });
      throw err;
    }
  },

  removeProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  toggleAvailable: async (id: number, available: number) => {
    // Optimistic update
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, available } : p)),
    }));
    try {
      const updated = await window.electronAPI.updateProduct({ id, available });
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (err) {
      // Revert on failure
      const prev = get().products.find((p) => p.id === id);
      if (prev) {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, available: available === 1 ? 0 : 1 } : p
          ),
          error: String(err),
        }));
      }
    }
  },
}));
