import React, { createContext, useContext } from 'react';
import { Product, Customer, Order, DashboardStats, Payment } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';

interface DataContextType {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalAmount' | 'paidAmount' | 'pendingBalance'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  makePayment: (customerId: string, amount: number, paymentDate: string) => void;
  getDashboardStats: (date?: string) => DashboardStats;
  getFilteredOrders: (filters: any) => Order[];
  getFilteredPayments: (filters: any) => Payment[];
  getDailyProductSales: (date: string) => { productName: string; totalQuantity: number }[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const [payments, setPayments] = useLocalStorage<Payment[]>('payments', []);

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalAmount' | 'paidAmount' | 'pendingBalance'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Math.random().toString(36).substr(2, 9),
      totalOrders: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers([...customers, newCustomer]);
  };

  const updateCustomer = (id: string, updatedCustomer: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updatedCustomer } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    setOrders(orders.filter(o => o.customerId !== id));
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setOrders([...orders, newOrder]);

    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      updateCustomer(customer.id, {
        totalOrders: customer.totalOrders + 1,
        totalAmount: customer.totalAmount + order.totalAmount,
        pendingBalance: customer.pendingBalance + order.totalAmount,
      });
    }
  };

  const updateOrder = (id: string, updatedOrder: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };
  
  const makePayment = (customerId: string, amount: number, paymentDate: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newPaidAmount = customer.paidAmount + amount;
      const newPendingBalance = Math.max(0, customer.pendingBalance - amount);
      updateCustomer(customerId, {
        paidAmount: newPaidAmount,
        pendingBalance: newPendingBalance,
      });

      const newPayment: Payment = {
        id: Math.random().toString(36).substr(2, 9),
        customerId,
        customerName: customer.name,
        amount,
        paymentDate,
        createdAt: new Date().toISOString(),
      };
      setPayments([...payments, newPayment]);
    }
  };

  const getDashboardStats = (date?: string): DashboardStats => {
    const targetDate = date ? parseISO(date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const todayOrders = orders.filter(order => 
      isWithinInterval(parseISO(order.orderDate), { start: dayStart, end: dayEnd })
    );
    
    const todayPayments = payments.filter(payment =>
      isWithinInterval(parseISO(payment.paymentDate), { start: dayStart, end: dayEnd })
    );

    const dailySelling = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const dailyCollection = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      dailySelling,
      dailyCollection,
      totalCustomers: customers.length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    };
  };

  const getFilteredOrders = (filters: any): Order[] => {
    return orders.filter(order => {
      if (filters.dateFrom && parseISO(order.orderDate) < parseISO(filters.dateFrom)) return false;
      if (filters.dateTo && parseISO(order.orderDate) > parseISO(filters.dateTo)) return false;
      if (filters.customer && order.customerId !== filters.customer) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.product) {
        const hasProduct = order.items.some(item => item.productId === filters.product);
        if (!hasProduct) return false;
      }
      return true;
    }).sort((a, b) => parseISO(b.orderDate).getTime() - parseISO(a.orderDate).getTime());
  };
  
  const getFilteredPayments = (filters: any): Payment[] => {
    return payments.filter(payment => {
      if (filters.dateFrom && parseISO(payment.paymentDate) < parseISO(filters.dateFrom)) return false;
      if (filters.dateTo && parseISO(payment.paymentDate) > parseISO(filters.dateTo)) return false;
      if (filters.customer && payment.customerId !== filters.customer) return false;
      return true;
    }).sort((a, b) => parseISO(b.paymentDate).getTime() - parseISO(a.paymentDate).getTime());
  };

  const getDailyProductSales = (date: string): { productName: string; totalQuantity: number }[] => {
    const targetDate = parseISO(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const todayOrders = orders.filter(order => 
      isWithinInterval(parseISO(order.orderDate), { start: dayStart, end: dayEnd })
    );

    const productSales: { [key: string]: { name: string; quantity: number } } = {};

    todayOrders.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
        } else {
          productSales[item.productId] = {
            name: item.productName,
            quantity: item.quantity,
          };
        }
      });
    });

    return Object.values(productSales).map(p => ({
      productName: p.name,
      totalQuantity: p.quantity,
    }));
  };

  return (
    <DataContext.Provider value={{
      products,
      customers,
      orders,
      payments,
      addProduct,
      updateProduct,
      deleteProduct,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addOrder,
      updateOrder,
      deleteOrder,
      makePayment,
      getDashboardStats,
      getFilteredOrders,
      getFilteredPayments,
      getDailyProductSales,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
