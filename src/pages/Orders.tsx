import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ShoppingCart, Search, Check, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Order, OrderItem } from '../types';
import { format } from 'date-fns';

function OrderCard({ order, onEdit, onDelete, onToggleStatus }: { order: Order, onEdit: (order: Order) => void, onDelete: (id: string) => void, onToggleStatus: (order: Order) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-sm font-semibold text-gray-600">
              Order Date: {format(new Date(order.orderDate), 'MMM dd, yyyy')}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'delivered' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="space-y-1 border-l-2 border-gray-200 pl-3">
            {order.items.map((item, index) => (
              <p key={index} className="text-sm text-gray-700">
                {item.quantity}x {item.productName} - ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            ))}
          </div>
          <p className="text-md font-bold text-gray-900 mt-2">
            Total: ₹{order.totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => onToggleStatus(order)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              order.status === 'delivered'
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={order.status === 'delivered' ? 'Mark as Pending' : 'Mark as Delivered'}
          >
            {order.status === 'delivered' ? <Clock className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onEdit(order)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerOrdersGroup({ customerName, orders, onEdit, onDelete, onToggleStatus }: { customerName: string, orders: Order[], onEdit: (order: Order) => void, onDelete: (id: string) => void, onToggleStatus: (order: Order) => void }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-50 rounded-2xl border border-gray-200"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{customerName} ({orders.length} Orders)</h3>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-gray-200">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


export function Orders() {
  const { orders, customers, products, addOrder, updateOrder, deleteOrder } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    items: [] as { productId: string; quantity: number }[],
    status: 'pending' as 'pending' | 'delivered'
  });

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, searchTerm, statusFilter]);

  const groupedOrders = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      (acc[order.customerId] = acc[order.customerId] || []).push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }, [filteredOrders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.items.length === 0) return;

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    const orderItems: OrderItem[] = formData.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || '',
        quantity: item.quantity,
        price: product?.price || 0
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      customerId: formData.customerId,
      customerName: customer.name,
      items: orderItems,
      totalAmount,
      status: formData.status,
      orderDate: formData.orderDate,
      deliveryDate: formData.status === 'delivered' ? new Date().toISOString() : undefined
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
    } else {
      addOrder(orderData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      orderDate: format(new Date(), 'yyyy-MM-dd'),
      items: [],
      status: 'pending'
    });
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customerId: order.customerId,
      orderDate: order.orderDate,
      items: order.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      status: order.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(id);
    }
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1 }]
    });
  };

  const removeOrderItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateOrderItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  const toggleOrderStatus = (order: Order) => {
    const newStatus = order.status === 'pending' ? 'delivered' : 'pending';
    updateOrder(order.id, { 
      status: newStatus,
      deliveryDate: newStatus === 'delivered' ? new Date().toISOString() : undefined
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and deliveries</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first order to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Order
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedOrders).map(([customerId, customerOrders]) => (
            <CustomerOrdersGroup
              key={customerId}
              customerName={customerOrders[0].customerName}
              orders={customerOrders}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={toggleOrderStatus}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingOrder ? 'Edit Order' : 'Add New Order'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Date
                    </label>
                    <input
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Order Items
                    </label>
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <select
                          value={item.productId}
                          onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="Qty"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.items.length === 0 && (
                      <p className="text-gray-500 text-sm">No items added yet</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200"
                  >
                    {editingOrder ? 'Update' : 'Create'} Order
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
