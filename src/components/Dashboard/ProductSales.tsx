import React from 'react';
import { motion } from 'framer-motion';
import { Milk } from 'lucide-react';

interface ProductSalesProps {
  data: { productName: string; totalQuantity: number }[];
}

export function ProductSales({ data }: ProductSalesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-soft p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Product Sales</h3>
      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sales today</p>
        ) : (
          data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                  <Milk className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.productName}</span>
              </div>
              <span className="font-semibold text-blue-600">{item.totalQuantity} units</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
