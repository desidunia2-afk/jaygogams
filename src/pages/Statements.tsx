import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Filter, DollarSign, PiggyBank } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  date: string;
  type: 'order' | 'payment';
  description: string;
  billed: number;
  paid: number;
  customerName: string;
}

export function Statements() {
  const { customers, getFilteredOrders, getFilteredPayments } = useData();
  const [filters, setFilters] = useState({
    customer: '',
    dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    period: 'month'
  });

  const transactions = useMemo(() => {
    const filterParams = {
      customer: filters.customer || undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    };
    const filteredOrders = getFilteredOrders(filterParams);
    const filteredPayments = getFilteredPayments(filterParams);

    const combined: Transaction[] = [
      ...filteredOrders.map(order => ({
        date: order.orderDate,
        type: 'order' as const,
        description: `Order: ${order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}`,
        billed: order.totalAmount,
        paid: 0,
        customerName: order.customerName,
      })),
      ...filteredPayments.map(payment => ({
        date: payment.paymentDate,
        type: 'payment' as const,
        description: `Payment received`,
        billed: 0,
        paid: payment.amount,
        customerName: payment.customerName,
      }))
    ];
    
    return combined.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [filters, getFilteredOrders, getFilteredPayments]);

  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = format(today, 'yyyy-MM-dd');

    switch (period) {
      case 'today':
        dateFrom = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        dateFrom = format(startOfWeek(today), 'yyyy-MM-dd');
        dateTo = format(endOfWeek(today), 'yyyy-MM-dd');
        break;
      case 'month':
        dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
        dateTo = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      default:
        dateFrom = filters.dateFrom;
        dateTo = filters.dateTo;
        break;
    }

    setFilters({ ...filters, period, dateFrom, dateTo });
  };

  const totalBilled = transactions.reduce((sum, tx) => sum + tx.billed, 0);
  const totalPaid = transactions.reduce((sum, tx) => sum + tx.paid, 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    const includeCustomerName = filters.customer === '';
    
    doc.setFontSize(20);
    doc.text('Jay Goga Milk Supplier', 20, 20);
    doc.setFontSize(14);
    doc.text('Account Statement', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Period: ${format(parseISO(filters.dateFrom), 'MMM dd, yyyy')} to ${format(parseISO(filters.dateTo), 'MMM dd, yyyy')}`, 20, 40);
    
    if (filters.customer) {
      const customer = customers.find(c => c.id === filters.customer);
      doc.text(`Customer: ${customer?.name || 'All Customers'}`, 20, 48);
    }

    const head = [['Date', ...(includeCustomerName ? ['Customer'] : []), 'Description', 'Billed', 'Paid']];
    const tableData = transactions.map(tx => [
      format(new Date(tx.date), 'dd/MM/yyyy'),
      ...(includeCustomerName ? [tx.customerName] : []),
      tx.description,
      tx.billed > 0 ? `₹${tx.billed.toFixed(2)}` : '-',
      tx.paid > 0 ? `₹${tx.paid.toFixed(2)}` : '-',
    ]);

    autoTable(doc, {
      head: head,
      body: tableData,
      startY: 60,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 233] },
      columnStyles: {
        [includeCustomerName ? 3 : 2]: { halign: 'right' },
        [includeCustomerName ? 4 : 3]: { halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text(`Total Amount: ₹${totalBilled.toFixed(2)}`, 20, finalY);
    doc.text(`Received Amount: ₹${totalPaid.toFixed(2)}`, 20, finalY + 8);
    doc.setFontSize(14);
    doc.text(`Pending Amount: ₹${(totalBilled - totalPaid).toFixed(2)}`, 20, finalY + 20);

    doc.save(`account-statement-${filters.dateFrom}-to-${filters.dateTo}.pdf`);
  };

  const exportToCSV = () => {
    const includeCustomerName = filters.customer === '';
    const headers = ['Date', ...(includeCustomerName ? ['Customer'] : []), 'Description', 'Billed', 'Paid'];
    
    const csvData = transactions.map(tx => [
      format(new Date(tx.date), 'yyyy-MM-dd'),
      ...(includeCustomerName ? [tx.customerName] : []),
      tx.description,
      tx.billed.toFixed(2),
      tx.paid.toFixed(2),
    ]);

    const totalRow = [
        '', 
        ...(includeCustomerName ? [''] : []), 
        'Total', 
        totalBilled.toFixed(2), 
        totalPaid.toFixed(2)
    ];

    const csvContent = [headers, ...csvData, [], totalRow]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `account-statement-${filters.dateFrom}-to-${filters.dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Statements</h1>
          <p className="text-gray-600">View and download customer account history</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            Excel
          </button>
          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Period
            </label>
            <div className="flex gap-2">
              {['today', 'week', 'month'].map(period => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    filters.period === period
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, period: 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, period: 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <select
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalBilled.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Received Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{(totalBilled - totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">Try adjusting your filters to see results</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  {filters.customer === '' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Billed</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </td>
                    {filters.customer === '' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {tx.customerName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900 max-w-sm">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 text-right">
                      {tx.billed > 0 ? `₹${tx.billed.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                      {tx.paid > 0 ? `₹${tx.paid.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
