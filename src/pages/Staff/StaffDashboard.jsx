import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  let displayName = null;
  if (user) {
    const given = user.firstName || user.username || user.email || '';
    const family = user.lastName ? ` ${user.lastName}` : '';
    displayName = (given + family).trim() || null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />
      
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0028b8] mb-2">
              Chào mừng, {displayName || 'Nhân viên trạm'} 👋
            </h1>
            <p className="text-gray-600">
              Bảng điều khiển dành cho nhân viên trạm sạc
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Quản lý pin */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Quản lý pin</h3>
              </div>
              <p className="text-gray-600 mb-4">Theo dõi trạng thái pin trong trạm</p>
              <button 
                onClick={() => navigate('/staff/batteries')}
                className="w-full bg-[#0028b8] text-white py-2 px-4 rounded-lg hover:bg-[#001a8b] transition-colors"
              >
                Quản lý pin
              </button>
            </div>

            {/* Giám sát pin realtime */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-yellow-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Giám sát pin</h3>
              </div>
              <p className="text-gray-600 mb-4">Theo dõi trạng thái pin realtime</p>
              <button 
                onClick={() => navigate('/staff/battery-monitoring')}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🔴 Live Monitoring
              </button>
            </div>

            {/* Quản lý giao dịch */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Quản lý giao dịch</h3>
              </div>
              <p className="text-gray-600 mb-4">Quản lý giao dịch pin của khách hàng</p>
              <button 
                onClick={() => navigate('/staff/transactions')}
                className="w-full bg-[#0028b8] text-white py-2 px-4 rounded-lg hover:bg-[#001a8b] transition-colors"
              >
                Xem lịch sử
              </button>
            </div>

            {/* Quản lý nhân viên */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Quản lý nhân viên</h3>
              </div>
              <p className="text-gray-600 mb-4">Xem và quản lý nhân viên trạm</p>
              <button 
                onClick={() => navigate('/staff/manage-staff')}
                className="w-full bg-[#0028b8] text-white py-2 px-4 rounded-lg hover:bg-[#001a8b] transition-colors"
              >
                Quản lý nhân viên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
