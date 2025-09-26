import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AuthPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Orders } from './pages/Orders';
import { Statements } from './pages/Statements';
import { Header } from './components/Layout/Header';
import { BottomNav } from './components/Layout/BottomNav';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <AuthPage />;
  }

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/products': return 'Products';
      case '/customers': return 'Customers';
      case '/orders': return 'Orders';
      case '/statements': return 'Statements';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={getPageTitle(location.pathname)} />
      <main className="flex-1 overflow-auto pb-24">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/statements" element={<Statements />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
