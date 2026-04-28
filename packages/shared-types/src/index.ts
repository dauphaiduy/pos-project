export interface OrderItem {
  productId: number;
  name: string;
  price: number; // cents
  quantity: number;
  note: string;
}

export interface Order {
  id: number;
  total: number;
  status: string;
  payment_method: string;
  items: OrderItem[];
  created_at: string;
}

export interface CreateOrderInput {
  total: number;
  status?: string;
  payment_method?: string;
  items?: OrderItem[];
}

export interface UpdateOrderInput {
  id: number;
  status: string;
}

export interface UpdateOrderItemsInput {
  id: number;
  items: OrderItem[];
  total: number;
  payment_method: string;
}

export interface Product {
  id: number;
  name: string;
  price: number; // cents
  category: string;
  emoji: string;
  available: number; // 1 = available, 0 = out of stock (SQLite boolean)
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  category: string;
  emoji?: string;
  available?: number;
}

export interface UpdateProductInput {
  id: number;
  name?: string;
  price?: number;
  category?: string;
  emoji?: string;
  available?: number;
}
