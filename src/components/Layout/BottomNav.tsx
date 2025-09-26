import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Statements', href: '/statements', icon: FileText },
];

export function BottomNav() {
  const { logout } = useAuth();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-40"
    >
      <nav className="grid grid-cols-6 h-full max-w-lg mx-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-primary-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={clsx('w-6 h-6', isActive ? 'text-primary-600' : 'text-gray-400')} />
                <span className="mt-1">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut className="w-6 h-6 text-gray-400 group-hover:text-red-600" />
          <span className="mt-1">Logout</span>
        </button>
      </nav>
    </motion.div>
  );
}
