import { ipcMain } from 'electron';
import { createOrderService, listOrdersService, updateOrderStatusService, updateOrderItemsService } from '../services/order.service';
import type { CreateOrderInput, UpdateOrderInput, UpdateOrderItemsInput } from '@pos/shared-types';

export function registerOrderHandlers(): void {
  ipcMain.handle('orders:create', async (_event, input: CreateOrderInput) => {
    return createOrderService(input);
  });

  ipcMain.handle('orders:list', async () => {
    return listOrdersService();
  });

  ipcMain.handle('orders:update-status', async (_event, input: UpdateOrderInput) => {
    return updateOrderStatusService(input);
  });

  ipcMain.handle('orders:update-items', async (_event, input: UpdateOrderItemsInput) => {
    return updateOrderItemsService(input);
  });
}
