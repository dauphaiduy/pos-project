import { createOrder, listOrders, updateOrderStatus, updateOrderItems } from '../repositories/order.repository';
import type { Order, CreateOrderInput, UpdateOrderInput, UpdateOrderItemsInput, OrderItem } from '@pos/shared-types';

export function createOrderService(input: CreateOrderInput): Order {
  if (!input.total || input.total <= 0) {
    throw new Error('Order total must be greater than 0');
  }
  return createOrder(input);
}

export function listOrdersService(): Order[] {
  return listOrders();
}

export function updateOrderStatusService(input: UpdateOrderInput): Order {
  const allowed = ['pending', 'completed', 'cancelled'];
  if (!allowed.includes(input.status)) {
    throw new Error(`Invalid status: ${input.status}`);
  }
  return updateOrderStatus(input.id, input.status);
}

export function updateOrderItemsService(input: UpdateOrderItemsInput): Order {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Order must have at least one item');
  }
  if (input.total <= 0) {
    throw new Error('Order total must be greater than 0');
  }
  return updateOrderItems(input.id, input.items as OrderItem[], input.total, input.payment_method);
}
