import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-gray-200 px-4 py-4 lg:px-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">Manage your milk business efficiently</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
