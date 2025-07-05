import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  if (!value || isNaN(Number(value))) return "0,00 ₺";
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue).replace('₺', '').trim() + " ₺";
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: tr });
}

// Türkçe karakter dönüşüm fonksiyonu
export function replaceTurkishChars(text: string): string {
  const turkishChars: { [key: string]: string } = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C'
  };

  return text.replace(/[ğĞüÜşŞıİöÖçÇ]/g, letter => turkishChars[letter] || letter);
}