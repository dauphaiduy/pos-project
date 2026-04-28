import type { Order, CreateOrderInput, UpdateOrderInput, UpdateOrderItemsInput, Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

let nextOrderId = 1;
const orderStore: Order[] = [
  {
    id: nextOrderId++, total: 105000, status: 'completed', payment_method: 'card',
    items: [
      { productId: 1, name: 'Espresso',   price: 35000, quantity: 1, note: '' },
      { productId: 13, name: 'Croissant', price: 35000, quantity: 2, note: 'extra butter' },
    ],
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: nextOrderId++, total: 30000, status: 'pending', payment_method: 'cash',
    items: [
      { productId: 6, name: 'Green Tea', price: 30000, quantity: 1, note: '' },
    ],
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
];

let nextProductId = 1;
const productStore: Product[] = [
  { id: nextProductId++, name: 'Espresso',       price: 35000, category: 'Coffee', emoji: '☕', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Latte',          price: 45000, category: 'Coffee', emoji: '🥛', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Cappuccino',     price: 45000, category: 'Coffee', emoji: '☕', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Cold Brew',      price: 40000, category: 'Coffee', emoji: '🧋', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Americano',      price: 30000, category: 'Coffee', emoji: '☕', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Green Tea',      price: 30000, category: 'Tea',    emoji: '🍵', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Oolong Tea',     price: 35000, category: 'Tea',    emoji: '🍵', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Jasmine Tea',    price: 30000, category: 'Tea',    emoji: '🍵', available: 0, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Matcha Latte',   price: 45000, category: 'Tea',    emoji: '🍵', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Orange Juice',   price: 40000, category: 'Juice',  emoji: '🍊', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Mango Smoothie', price: 50000, category: 'Juice',  emoji: '🥭', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Lemon Soda',     price: 35000, category: 'Juice',  emoji: '🍋', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Croissant',      price: 35000, category: 'Food',   emoji: '🥐', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Sandwich',       price: 55000, category: 'Food',   emoji: '🥪', available: 1, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Cheesecake',     price: 40000, category: 'Food',   emoji: '🍰', available: 0, created_at: new Date().toISOString() },
  { id: nextProductId++, name: 'Waffle',         price: 45000, category: 'Food',   emoji: '🧇', available: 1, created_at: new Date().toISOString() },
];

export const electronAPIMock: Window['electronAPI'] = {
  // ── Orders ────────────────────────────────────────────
  createOrder: async (input: CreateOrderInput): Promise<Order> => {
    await delay(200);
    const order: Order = {
      id: nextOrderId++,
      total: input.total,
      status: input.status ?? 'pending',
      payment_method: input.payment_method ?? 'cash',
      items: input.items ?? [],
      created_at: new Date().toISOString(),
    };
    orderStore.unshift(order);
    return order;
  },

  listOrders: async (): Promise<Order[]> => {
    await delay(150);
    return [...orderStore];
  },

  updateOrderStatus: async (input: UpdateOrderInput): Promise<Order> => {
    await delay(150);
    const order = orderStore.find((o) => o.id === input.id);
    if (!order) throw new Error(`Order ${input.id} not found`);
    order.status = input.status;
    return { ...order };
  },

  updateOrderItems: async (input: UpdateOrderItemsInput): Promise<Order> => {
    await delay(150);
    const order = orderStore.find((o) => o.id === input.id);
    if (!order) throw new Error(`Order ${input.id} not found`);
    order.items = input.items;
    order.total = input.total;
    order.payment_method = input.payment_method;
    return { ...order };
  },

  // ── Products ──────────────────────────────────────────
  listProducts: async (): Promise<Product[]> => {
    await delay(150);
    return [...productStore].sort((a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    );
  },

  createProduct: async (input: CreateProductInput): Promise<Product> => {
    await delay(200);
    const product: Product = {
      id: nextProductId++,
      name: input.name,
      price: input.price,
      category: input.category,
      emoji: input.emoji ?? '',
      available: input.available ?? 1,
      created_at: new Date().toISOString(),
    };
    productStore.push(product);
    return product;
  },

  updateProduct: async (input: UpdateProductInput): Promise<Product> => {
    await delay(150);
    const p = productStore.find((p) => p.id === input.id);
    if (!p) throw new Error(`Product ${input.id} not found`);
    if (input.name      !== undefined) p.name      = input.name;
    if (input.price     !== undefined) p.price     = input.price;
    if (input.category  !== undefined) p.category  = input.category;
    if (input.emoji     !== undefined) p.emoji     = input.emoji;
    if (input.available !== undefined) p.available = input.available;
    return { ...p };
  },

  deleteProduct: async (id: number): Promise<void> => {
    await delay(150);
    const idx = productStore.findIndex((p) => p.id === id);
    if (idx !== -1) productStore.splice(idx, 1);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
