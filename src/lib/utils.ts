import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatFileType(type: string) {
  const map: Record<string, string> = {
    nfe: 'NF-e',
    bank_statement: 'Extrato Bancário',
    contract: 'Contrato',
    other: 'Outro',
  }
  return map[type] ?? type
}

export function formatStatus(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    done: 'Concluído',
    error: 'Erro',
  }
  return map[status] ?? status
}
