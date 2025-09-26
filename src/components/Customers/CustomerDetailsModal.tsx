import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, MapPin, ShoppingCart, Wallet } from 'lucide-react';
import { Customer } from '../../types';
import { useData } from '../../contexts/DataContext';
import { format, parseISO } from 'date-fns';

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
  onRecordPayment: (customer: Customer) => void;
}

export function CustomerDetailsModal({ customer, onClose, onRecordPayment }: CustomerDetailsModalProps) {
  const { orders } = useData();
  const customerOrders = orders
    .filter(order => order.customerId === customer.id)
    .sort((a, b) => parseISO(b.orderDate).getTime() - parseISO(a.orderDate).getTime());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}'s Account</h2>
            <p className="text-gray-600">Full financial and order history</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-gray-800">{customer.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <span className="text-gray-800">{customer.phone}</span>
          </div>
          <div className="flex items-start gap-3 col-span-1 md:col-span-2">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
            <span className="text-gray-800">{customer.address}</span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-700">Total Billed</p>
                <p className="text-xl font-bold text-blue-900">₹{customer.totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-sm text-green-700">Total Paid</p>
                <p className="text-xl font-bold text-green-900">₹{customer.paidAmount.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-sm text-red-700">Pending</p>
                <p className="text-xl font-bold text-red-900">₹{customer.pendingBalance.toFixed(2)}</p>
            </div>
        </div>
        
        {/* Order History */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
          {customerOrders.length > 0 ? (
            <div className="space-y-4">
              {customerOrders.map(order => (
                <div key={order.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">Order on {format(parseISO(order.orderDate), 'MMM dd, yyyy')}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{order.status}</span>
                  </div>
                  
                  <div className="mt-3 space-y-2 border-l-2 border-gray-200 pl-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.productName} <span className="text-gray-500 text-xs">(@ ₹{item.price.toFixed(2)})</span>
                        </span>
                        <span className="font-medium text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 mt-3 pt-2 flex justify-end">
                    <p className="text-right font-semibold text-gray-800">Order Total: ₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No orders placed by this customer yet.</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={() => onRecordPayment(customer)}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200"
          >
            <Wallet className="w-5 h-5" />
            Record a Payment
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
