import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Clock,
  Filter,
  PiggyBank,
  Landmark
} from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { ProductSales } from '../components/Dashboard/ProductSales';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

export function Dashboard() {
  const { getDashboardStats, getDailyProductSales, customers } = useData();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const stats = getDashboardStats(selectedDate);
  const productSales = getDailyProductSales(selectedDate);

  const totalSales = customers.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalPaid = customers.reduce((acc, c) => acc + c.paidAmount, 0);
  const totalPending = customers.reduce((acc, c) => acc + c.pendingBalance, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your milk business performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Daily Selling"
          value={`₹${stats.dailySelling.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Daily Collection"
          value={`₹${stats.dailyCollection.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Overall Sales"
          value={`₹${totalSales.toFixed(2)}`}
          icon={Landmark}
          color="purple"
        />
        <StatsCard
          title="Overall Paid"
          value={`₹${totalPaid.toFixed(2)}`}
          icon={PiggyBank}
          color="yellow"
        />
        <StatsCard
          title="Pending Amount"
          value={`₹${totalPending.toFixed(2)}`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Product Sales */}
      <div className="grid grid-cols-1 gap-6">
        <ProductSales data={productSales} />
      </div>
    </div>
  );
}
