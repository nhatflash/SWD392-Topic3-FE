import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getProfile, logout as apiLogout } from '../../../services/auth';
import { getCurrentProfile, resolveAssetUrl } from '../../../services/user';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ProfileUser = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(user || null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCurrentProfile()
      .then(p => {
        if (p && mounted) {
          setProfile(p);
          try { setUser(p); localStorage.setItem('user', JSON.stringify(p)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-8">Đang tải thông tin...</div>;

  const firstName = profile?.firstName || '';
  const lastName = profile?.lastName || '';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const identity = profile?.identityNumber || '';
  const dobRaw = profile?.dateOfBirth || '';
  
  let dob = dobRaw;
  if (dobRaw) {
    const d = new Date(dobRaw);
    if (!isNaN(d.getTime())) {
      dob = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  }

  
  let initials = '?';
  if (firstName || lastName) {
    initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase();
  } else if (email) {
    initials = email[0].toUpperCase();
  }

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
    try { await apiLogout(); } catch (e) { console.warn('apiLogout failed', e); }
    try { logout(); } catch (e) { console.warn('context logout failed, clearing localStorage', e); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); }
    await Swal.fire({ icon: 'success', title: 'Đã đăng xuất', showConfirmButton: false, timer: 900 });
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
            {/* Avatar / summary */}
            <div className="flex-shrink-0 flex items-center justify-center">
              {(() => {
                const raw = profile?.avatarUrl || '';
                const resolved = resolveAssetUrl(raw);
                const ok = resolved.startsWith('http://') || resolved.startsWith('https://') || resolved.startsWith('data:');
                if (ok) {
                  return (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg">
                      <img src={resolved} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  );
                }
                return (
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-semibold shadow">
                    {initials}
                  </div>
                );
              })()}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{firstName} {lastName}</h2>
                  <p className="text-sm text-gray-500">{email}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/profile/edit')} 
                    className="px-4 py-2 bg-[#0028b8] text-white rounded-md text-sm hover:bg-[#001a8b] transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button onClick={() => navigate('/mainpage/HomePage')} className="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200">Quay lại</button>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Đăng xuất</button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-xs text-gray-500">Họ & tên</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{firstName} {lastName}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-xs text-gray-500">Số điện thoại</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{phone || '-'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-xs text-gray-500">Số CMND/CCCD</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{identity || '-'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-xs text-gray-500">Ngày sinh</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{dob || '-'}</div>
                </div>

                <div className="sm:col-span-2 bg-gray-50 p-4 rounded-md">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{email || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;
