import { contextBridge, ipcRenderer } from 'electron';
import type { Order, CreateOrderInput, UpdateOrderInput, Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

contextBridge.exposeInMainWorld('electronAPI', {
  createOrder: (input: CreateOrderInput): Promise<Order> =>
    ipcRenderer.invoke('orders:create', input),

  listOrders: (): Promise<Order[]> =>
    ipcRenderer.invoke('orders:list'),

  updateOrderStatus: (input: UpdateOrderInput): Promise<Order> =>
    ipcRenderer.invoke('orders:update-status', input),

  listProducts: (): Promise<Product[]> =>
    ipcRenderer.invoke('products:list'),

  createProduct: (input: CreateProductInput): Promise<Product> =>
    ipcRenderer.invoke('products:create', input),

  updateProduct: (input: UpdateProductInput): Promise<Product> =>
    ipcRenderer.invoke('products:update', input),

  deleteProduct: (id: number): Promise<void> =>
    ipcRenderer.invoke('products:delete', id),
});
