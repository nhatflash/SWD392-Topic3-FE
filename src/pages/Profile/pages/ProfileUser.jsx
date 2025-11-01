import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { logout as apiLogout } from '../../../services/auth';
import { getCurrentProfile, resolveAssetUrl } from '../../../services/user';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import Vehicle from './vehicles/Vehicle';
import MyOrders from '../../Driver/MyOrders/MyOrders';

// Component for orders icon
const OrdersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

function ProfileUser() {
  const { user, setUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(user || null);
  const [active, setActive] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in first
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    
    getCurrentProfile()
      .then(p => {
        if (p && mounted) {
          setProfile(p);
          try { 
            setUser(p); 
            localStorage.setItem('user', JSON.stringify(p)); 
          } catch (err) {
            console.error('Error saving user data:', err);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
        if (mounted) {
          setError(err.message || 'Không thể tải thông tin người dùng');
          // If unauthorized, redirect to login
          if (err.response?.status === 401) {
            navigate('/login');
          }
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex justify-center">
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0028b8] mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải thông tin...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex justify-center">
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-4 px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex justify-center">
      <div className="p-8 text-center">
        <p className="text-gray-600">Không tìm thấy thông tin người dùng</p>
        <button 
          onClick={() => navigate('/login')} 
          className="mt-4 px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );

  const firstName = profile?.firstName || '';
  const lastName = profile?.lastName || '';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const identity = profile?.identityNumber || '';
  const dobRaw = profile?.dateOfBirth || '';
  
  let dob = dobRaw;
  if (dobRaw) {
    const d = new Date(dobRaw);
    if (!Number.isNaN(d.getTime())) {
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
    navigate('/mainpage/HomePage');
  };

  const getSidebarItems = () => {
    if (hasRole("ADMIN") || hasRole("STAFF")) {
      return [
        { key: "profile", label: "Thông tin cá nhân" },
        //{ key: "vehicles", label: "Phương tiện" }
      ];
    } else if (hasRole("DRIVER")) {
      return [
        { key: "profile", label: "Thông tin cá nhân" },
        { key: "vehicles", label: "Phương tiện" },
        { key: "orders", label: "Đơn hàng của tôi", icon: OrdersIcon }
      ];
    }
    return undefined;
  };
  return (
    <div className="min-h-screen bg-gray-50 pt-24 flex">
      {/* Sidebar cố định bên trái */}
      <Sidebar
        active={active}
        onSelect={setActive}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        items={getSidebarItems()}
        onBack={() => navigate("/mainpage/HomePage")}
        onLogout={handleLogout}
      />
  
      {/* Content chính, dính sát sidebar */}
      <div
        className="flex-1 transition-all duration-300 p-6 md:p-8"
        style={{ paddingLeft: sidebarOpen ? "16rem" : "5rem" }} // 16rem = w-64, 5rem = w-20
      >
        {active === "profile" && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
              {/* Avatar / summary */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {(() => {
                  const raw = profile?.avatarUrl || "";
                  const resolved = resolveAssetUrl(raw);
                  const ok =
                    resolved.startsWith("http://") ||
                    resolved.startsWith("https://") ||
                    resolved.startsWith("data:");
                  if (ok) {
                    return (
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg">
                        <img
                          src={resolved}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
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
                    <h2 className="text-2xl font-bold text-gray-800">
                      {firstName} {lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/profile/edit")}
                      className="px-4 py-2 bg-[#0028b8] text-white rounded-md text-sm hover:bg-[#001a8b] transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    {hasRole("ADMIN") && (
                      <button
                        onClick={() => navigate("/dashboard/admin")}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                      >
                        Vào trang Admin
                      </button>
                    )}
  
                    {hasRole("STAFF") && (
                      <button
                        onClick={() => navigate("/staff/dashboard")}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                      >
                        Vào trang Nhân viên
                      </button>
                    )}
                  </div>
                </div>
  
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500">Họ & tên</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {firstName} {lastName}
                    </div>
                  </div>
  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500">Số điện thoại</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {phone || "-"}
                    </div>
                  </div>
  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500">Số CMND/CCCD</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {identity || "-"}
                    </div>
                  </div>
  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500">Ngày sinh</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {dob || "-"}
                    </div>
                  </div>
  
                  <div className="sm:col-span-2 bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {email || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "vehicles" && <Vehicle />}
        {active === "orders" && <MyOrders />}
      </div>
    </div>
  ); 
};

export default ProfileUser;
