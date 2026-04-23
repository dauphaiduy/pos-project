import { createOrder, listOrders, updateOrderStatus } from '../repositories/order.repository';
import type { Order, CreateOrderInput, UpdateOrderInput } from '@pos/shared-types';

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
