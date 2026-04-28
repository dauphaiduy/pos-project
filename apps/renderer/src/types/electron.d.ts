import type { Order, CreateOrderInput, UpdateOrderInput, UpdateOrderItemsInput, Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

declare global {
  interface Window {
    electronAPI: {
      createOrder: (input: CreateOrderInput) => Promise<Order>;
      listOrders: () => Promise<Order[]>;
      updateOrderStatus: (input: UpdateOrderInput) => Promise<Order>;
      updateOrderItems: (input: UpdateOrderItemsInput) => Promise<Order>;
      listProducts: () => Promise<Product[]>;
      createProduct: (input: CreateProductInput) => Promise<Product>;
      updateProduct: (input: UpdateProductInput) => Promise<Product>;
      deleteProduct: (id: number) => Promise<void>;
    };
  }
}

export {};
