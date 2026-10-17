import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Calculator from './pages/Calculator';
import WhatIfSimulator from './pages/WhatIfSimulator';
import Optimizer from './pages/Optimizer';
import AIAdvisor from './pages/AIAdvisor';
import Forecasting from './pages/Forecasting';
import SupplierAnalysis from './pages/SupplierAnalysis';
import BatchManager from './pages/BatchManager';
import AuthModal from './components/AuthModal';

import { getInitialSampleBatches } from './utils/sampleData';
import { calculateBatchEconomics } from './utils/calculator';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('foodcost_batches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getInitialSampleBatches();
      }
    }
    return getInitialSampleBatches();
  });

  const [activeBatchId, setActiveBatchId] = useState(batches[0]?.id || 'batch_demo_1');

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('foodcost_user');
    return savedUser ? JSON.parse(savedUser) : {
      id: 'user_guest',
      name: 'DEMO Guest',
      email: 'guest@demo.com',
      companyName: 'Demo Foods Corp (Sample Data)'
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodcost_token') || 'demo_token');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync batches to localStorage
  useEffect(() => {
    localStorage.setItem('foodcost_batches', JSON.stringify(batches));
  }, [batches]);

  const activeBatch = batches.find(b => b.id === activeBatchId) || batches[0] || {};

  const handleSaveBatch = (updatedBatchObj) => {
    const eco = calculateBatchEconomics(updatedBatchObj);
    const full = {
      ...updatedBatchObj,
      id: updatedBatchObj.id || 'batch_' + Date.now(),
      economics: eco,
      updatedAt: new Date().toISOString()
    };

    setBatches(prev => {
      const idx = prev.findIndex(b => b.id === full.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = full;
        return next;
      }
      return [full, ...prev];
    });

    setActiveBatchId(full.id);
  };

  const handleDuplicateBatch = (id) => {
    const target = batches.find(b => b.id === id);
    if (!target) return;
    const copy = {
      ...target,
      id: 'batch_' + Date.now(),
      productName: `${target.productName} (Copy)`,
      createdAt: new Date().toISOString()
    };
    copy.economics = calculateBatchEconomics(copy);

    setBatches(prev => [copy, ...prev]);
    setActiveBatchId(copy.id);
  };

  const handleDeleteBatch = (id) => {
    if (batches.length <= 1) {
      alert('Cannot delete the only batch. Keep at least one batch active.');
      return;
    }
    setBatches(prev => prev.filter(b => b.id !== id));
    if (activeBatchId === id) {
      const remaining = batches.filter(b => b.id !== id);
      setActiveBatchId(remaining[0]?.id);
    }
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('foodcost_token', newToken);
    localStorage.setItem('foodcost_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('foodcost_token');
    localStorage.removeItem('foodcost_user');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'landing' && (
          <LandingPage
            onLaunchApp={(tab) => setActiveTab(tab)}
            onSelectPreset={(preset) => {
              handleSaveBatch(preset);
              setActiveTab('calculator');
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            batches={batches}
            activeBatch={activeBatch}
            onSelectBatch={(b) => setActiveBatchId(b.id)}
            onNavigate={(tab) => setActiveTab(tab)}
            onDuplicateBatch={handleDuplicateBatch}
            onDeleteBatch={handleDeleteBatch}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            batches={batches}
            activeBatch={activeBatch}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'calculator' && (
          <Calculator
            activeBatch={activeBatch}
            onSaveBatch={handleSaveBatch}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfSimulator
            activeBatch={activeBatch}
            batches={batches}
          />
        )}

        {activeTab === 'optimizer' && (
          <Optimizer
            activeBatch={activeBatch}
            batches={batches}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <AIAdvisor
            activeBatch={activeBatch}
            batches={batches}
          />
        )}

        {activeTab === 'forecasting' && (
          <Forecasting />
        )}

        {activeTab === 'suppliers' && (
          <SupplierAnalysis />
        )}

        {activeTab === 'batches' && (
          <BatchManager
            batches={batches}
            onSelectBatch={(b) => setActiveBatchId(b.id)}
            onNavigate={(tab) => setActiveTab(tab)}
            onDuplicateBatch={handleDuplicateBatch}
            onDeleteBatch={handleDeleteBatch}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
