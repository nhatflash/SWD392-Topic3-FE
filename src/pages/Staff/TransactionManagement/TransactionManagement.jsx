import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import SwapConfirmationTab from './SwapConfirmationTab';
import SwapProcessingTab from './SwapProcessingTab';
import CreateWalkInTab from './CreateWalkInTab';
import SwapHistoryTab from './SwapHistoryTab';
import { getAllUnconfirmedSwaps } from '../../../services/swapTransaction';

const TransactionManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('confirmation'); // confirmation, processing, walkin, history
  const [unconfirmedCount, setUnconfirmedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load unconfirmed swaps count
  const loadUnconfirmedCount = async () => {
    try {
      setLoading(true);
      const swaps = await getAllUnconfirmedSwaps();
      
      // Filter only unconfirmed swaps (same logic as SwapConfirmationTab)
      const unconfirmedSwaps = swaps.filter(swap => 
        swap.status === 'SCHEDULED' || swap.status === 'PENDING'
      );
      
      setUnconfirmedCount(unconfirmedSwaps.length);
    } catch (e) {
      console.error('Failed to load unconfirmed swaps:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnconfirmedCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnconfirmedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      id: 'confirmation',
      label: 'Chờ duyệt',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: unconfirmedCount
    },
    {
      id: 'processing',
      label: 'Đang xử lý',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'walkin',
      label: 'Tạo Walk-in',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      id: 'history',
      label: 'Lịch sử',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="flex items-center text-[#0028b8] hover:text-[#001a8b] mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại Dashboard
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý giao dịch đổi pin</h1>
                <p className="text-gray-600 mt-1">Duyệt đơn, tạo walk-in, và xử lý giao dịch</p>
              </div>
              
              <div className="flex items-center gap-3">
                {loading && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0028b8]"></div>
                    <span className="text-sm">Đang cập nhật...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium
                      hover:bg-gray-50 focus:z-10 transition-all
                      ${activeTab === tab.id 
                        ? 'text-[#0028b8] border-b-2 border-[#0028b8]' 
                        : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm">
            {activeTab === 'confirmation' && <SwapConfirmationTab onUpdate={loadUnconfirmedCount} />}
            {activeTab === 'processing' && <SwapProcessingTab />}
            {activeTab === 'walkin' && <CreateWalkInTab />}
            {activeTab === 'history' && <SwapHistoryTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;
