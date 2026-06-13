import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarPreco(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function getStockQuantity(stock: number | Record<string, number>, selectedSize?: string) {
  if (typeof stock === 'number') return stock;
  if (selectedSize) return stock[selectedSize] ?? 0;
  return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
}
