export enum Page {
  DASHBOARD = 'DASHBOARD',
  CONNECT = 'CONNECT',
  CONVERSATIONS = 'CONVERSATIONS',
  SETTINGS = 'SETTINGS',
  FINANCE = 'FINANCE',
  CALENDAR = 'CALENDAR',
  EXPENSES = 'EXPENSES',
  CLIENTS = 'CLIENTS',
  SALES = 'SALES',
  EMPLOYEES = 'EMPLOYEES'
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface QuoteItem {
  serviceId: string;
  serviceName: string; // duplicate for easier display if service deleted
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  sellerName?: string;
  items: QuoteItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  date: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Client {
  id: string;
  cnpj: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  address: string;
  email?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: string;
  phone: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  month: string;
  category: string;
  clientId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  type: 'bill' | 'reminder' | 'meeting';
  completed: boolean;
  amount?: number;
}

export interface ExpenseItem {
  id: string;
  description: string;
  type: 'income' | 'expense';
  value: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  page?: Page;
}

export interface Employee {
  id: string;

  // Dados Básicos
  costCenter: string;
  fullName: string;
  position: string;
  hireDate: string;
  workSchedule: string; // ESCALA

  // Remuneração
  baseSalary: number; // SALARIO BASE
  additionalPercent20: number; // ADIC. 20%
  attendance: number; // ASSIDUIDADE

  // Benefícios
  mealVoucher: number; // VA
  foodVoucherPerDay: number; // VR DIA
  foodVoucherTotal: number; // VR TOTAL
  transportVoucherPerDay: number; // VT DIA
  transportVoucherTotal: number; // VT TOTAL

  // Descontos / Ajustes
  absenceDays: number; // FALTAS DIAS
  absenceTotal: number; // FALTAS TOTAL

  // Custos Operacionais
  fuel: number; // COMBUSTIVEL
  carRental: number; // ALUGUEL CARRO

  // Outros
  observations: string; // OBS

  // Campos Legados (manter compatibilidade)
  cpf?: string;
  department?: string;
  email?: string;
  phone?: string;
  salary?: number;
  status?: 'active' | 'inactive' | 'vacation';
  address?: string;
  birthDate?: string;
}
