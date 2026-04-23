import { listProducts, createProduct, updateProduct, deleteProduct } from '../repositories/product.repository';
import type { Product, CreateProductInput, UpdateProductInput } from '@pos/shared-types';

const CATEGORIES = ['Coffee', 'Tea', 'Juice', 'Food'];

function validateInput(input: CreateProductInput) {
  if (!input.name?.trim()) throw new Error('Product name is required');
  if (!input.price || input.price < 1000) throw new Error('Giá phải ít nhất 1.000 ₫');
  if (!CATEGORIES.includes(input.category)) throw new Error(`Category must be one of: ${CATEGORIES.join(', ')}`);
}

export function listProductsService(): Product[] {
  return listProducts();
}

export function createProductService(input: CreateProductInput): Product {
  validateInput(input);
  return createProduct(input);
}

export function updateProductService(input: UpdateProductInput): Product {
  if (input.category !== undefined && !CATEGORIES.includes(input.category)) {
    throw new Error(`Category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (input.price !== undefined && input.price < 1000) {
    throw new Error('Giá phải ít nhất 1.000 ₫');
  }
  return updateProduct(input);
}

export function deleteProductService(id: number): void {
  deleteProduct(id);
}
