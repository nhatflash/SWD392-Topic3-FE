import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout, default as API } from '../services/auth';
import { resolveAssetUrl } from '../services/user';

const Header = () => {
  const navigate = useNavigate();
  const { logout: contextLogout, user } = useAuth();

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
    navigate('/login');
  };

  return (
    <header className="w-full bg-white shadow p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-[#00b894]">EV Battery Swapper</h1>
      </div>
      <div className="flex items-center gap-3">
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
              <div className="w-8 h-8 rounded-full bg-[#00b894] text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            );
          })()}
        </button>
        <button onClick={handleLogout} className="bg-[#00b894] text-white px-3 py-1 rounded-md">Đăng xuất</button>
      </div>
    </header>
  );
};

export default Header;
