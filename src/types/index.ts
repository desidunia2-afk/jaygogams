export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id:string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'delivered';
  orderDate: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export interface DashboardStats {
  dailySelling: number;
  dailyCollection: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  product?: string;
  status?: string;
}
