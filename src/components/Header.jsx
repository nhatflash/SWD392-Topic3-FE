import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import BookingBatteryModal from './BookingBatteryModal';
import API, { logout as apiLogout } from '../services/auth';
import { resolveAssetUrl } from '../services/user';

const Header = () => {
  const navigate = useNavigate();
  const { logout: contextLogout, user, isAuthenticated, hasRole } = useAuth();
  const [showBooking, setShowBooking] = useState(false);

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'Đăng xuất',
      text: 'Bạn có chắc chắn muốn đăng xuất?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
    });
    if (!res.isConfirmed) return;

    // Immediately clear client auth state and remove Authorization header
    try {
      contextLogout();
    } catch (e) {
      console.warn('contextLogout failed, clearing localStorage', e);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    try { delete API.defaults.headers.common.Authorization; } catch (e) { console.warn('failed to delete default auth header', e); }

    // Fire-and-forget backend logout (server may need a token; this is best-effort)
    (async () => {
      try { await apiLogout(); } catch (e) { console.warn('apiLogout failed', e); }
    })();

    await Swal.fire({ icon: 'success', title: 'Đã đăng xuất', showConfirmButton: false, timer: 900 });
    navigate('/mainpage/HomePage');
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-white shadow-lg px-6 py-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/mainpage/HomePage')} 
          className="text-2xl font-bold text-[#0028b8] hover:text-[#001a8b] transition-colors cursor-pointer"
        >
          EV Battery Swapper
        </button>
        <nav className="flex items-center gap-2 ml-4">
          <button
            onClick={() => navigate('/stations')}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0028b8] text-white rounded-full shadow hover:bg-[#335cff] transition-colors text-sm"
            aria-label="Trạm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636" />
            </svg>
            <span className="font-medium">Trạm</span>
          </button>
          {/* Nút đặt lịch đổi/thuê pin cho Driver */}
          {hasRole?.('DRIVER') && (
            <button
              onClick={() => setShowBooking(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0028b8] text-white rounded-full shadow hover:bg-[#335cff] transition-colors text-sm"
              aria-label="Đặt lịch đổi/thuê pin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đặt lịch đổi/thuê pin
            </button>
          )}
        </nav>
      </div>
  <div className="flex items-center gap-4">
        {isAuthenticated && (
          <button onClick={() => navigate('/profile')} aria-label="Profile" className="p-1 rounded-full bg-white shadow">
            {(() => {
              const url = resolveAssetUrl(user?.avatarUrl || '');
              const showImg = !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'));
              if (showImg) {
                return (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                );
              }
              const initials = ((user?.firstName?.[0] || user?.email?.[0] || '?') + (user?.lastName?.[0] || '')).toUpperCase();
              return (
                <div className="w-8 h-8 rounded-full bg-[#0028b8] text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
              );
            })()}
          </button>
        )}
        <button 
          onClick={isAuthenticated ? handleLogout : () => navigate('/login')} 
          className="bg-[#0028b8] text-white px-4 py-2 rounded-md hover:bg-[#001a8b] transition-colors"
        >
          {isAuthenticated ? 'Đăng xuất' : 'Đăng nhập'}
        </button>
      </div>
      {/* Modal đặt lịch đổi/thuê pin */}
      <BookingBatteryModal open={showBooking} onClose={() => setShowBooking(false)} onBooked={() => {}} />
    </header>
  );
};

export default Header;
