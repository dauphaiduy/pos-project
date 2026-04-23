import { ipcMain } from 'electron';
import {
  listProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
} from '../services/product.service';
import type { CreateProductInput, UpdateProductInput } from '@pos/shared-types';

export function registerProductHandlers(): void {
  ipcMain.handle('products:list', async () => {
    return listProductsService();
  });

  ipcMain.handle('products:create', async (_event, input: CreateProductInput) => {
    return createProductService(input);
  });

  ipcMain.handle('products:update', async (_event, input: UpdateProductInput) => {
    return updateProductService(input);
  });

  ipcMain.handle('products:delete', async (_event, id: number) => {
    deleteProductService(id);
  });
}
