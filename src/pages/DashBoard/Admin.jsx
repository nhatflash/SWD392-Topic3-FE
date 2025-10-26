import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard,
  Users,
  Battery,
  FileBarChart,
  LogOut,
  Menu,
} from "lucide-react"; // icon đẹp (npm install lucide-react)
import { useAuth } from '../../context/AuthContext';
import { logout as apiLogout, clearTokens, default as API } from '../../services/auth';
import { getUsers, getUsersByRole } from '../../services/admin';
import { resolveAssetUrl } from '../../services/user';
import { getAllStations, createStation, updateStation, changeStationStatus } from '../../services/station';

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [activeView, setActiveView] = useState('overview'); // overview | users | stations
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStationStatus, setSelectedStationStatus] = useState('ALL'); // ALL | ADMIN | CUSTOMER | STAFF
  const [userCount, setUserCount] = useState(0);
  const [operationalStationCount, setOperationalStationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = async (role = selectedRole) => {
    try {
      setLoading(true);
      setError('');
      let data = [];
      if (role && role !== 'ALL') {
        data = await getUsersByRole(role, { page: currentPage });
      } else {
        data = await getUsers({ page: currentPage });
      }
      setUsers(data);
      // also update count based on current filter (best-effort, limited by page size)
      try {
        if (role && role !== 'ALL') {
          const all = await getUsersByRole(role, { page: 1 });
          setUserCount(Array.isArray(all) ? all.length : 0);
        } else {
          const all = await getUsers({ page: 1 });
          setUserCount(Array.isArray(all) ? all.length : 0);
        }
      } catch {}
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserCount = async () => {
    try {
      const all = await getUsers({ page: 1 });
      setUserCount(Array.isArray(all) ? all.length : 0);
    } catch (e) {
      console.error('Failed to load user count:', e);
      // keep previous count on error
    }
  };

  const loadStations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllStations();
      setStations(data);
      const operationalCount = data.filter(station => station.status === 'OPERATIONAL').length;
      setOperationalStationCount(operationalCount);
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách trạm');
      console.error('Failed to load stations:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadUserCount();
    loadStations();
  }, []);

  // Ensure counts refresh when switching back to overview
  useEffect(() => {
    if (activeView === 'overview') {
      loadUserCount();
      loadStations();
    }
  }, [activeView]);

  return (
    <div className="flex h-screen bg-gray-100">
      
      <aside
        className={`bg-[#0028b8] text-white p-4 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold transition-all ${
              isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            EV Swapper
          </h2>
          <button onClick={toggleSidebar} className="text-white">
            <Menu />
          </button>
        </div>

        <nav>
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => { setActiveView('overview'); loadUserCount(); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <LayoutDashboard /> {isSidebarOpen && "Dashboard"}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveView('users'); loadUsers(); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <Users /> {isSidebarOpen && "Quản lý Users"}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveView('stations'); loadStations(); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <Battery /> {isSidebarOpen && "Quản lý trạm"}
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/dashboard/admin/staff')}
                className="flex items-center gap-3 p-2 rounded bg-[#335cff]/20 hover:bg-[#335cff] w-full text-left relative group"
              >
                <div className="absolute inset-y-0 -left-1 w-1 bg-white transform scale-y-0 group-hover:scale-y-100 transition-transform"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isSidebarOpen && (
                  <span className="flex items-center gap-2">
                    Quản lý nhân viên
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">New</span>
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => Swal.fire({ icon: 'info', title: 'Chức năng đang phát triển', text: 'Báo cáo sẽ có sớm!' })}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <FileBarChart /> {isSidebarOpen && "Báo cáo"}
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/mainpage/HomePage')}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {isSidebarOpen && "Về trang chủ"}
              </button>
            </li>
            <li>
              <button
                onClick={async () => {
                  
                  const result = await Swal.fire({
                    title: 'Đăng xuất',
                    text: 'Bạn có chắc chắn muốn đăng xuất không?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Đăng xuất',
                    cancelButtonText: 'Hủy',
                  });
                  if (!result.isConfirmed) return;

                  // Immediately clear client auth state, tokens and remove Authorization header
                  try {
                    contextLogout();
                  } catch (e) {
                    console.warn('contextLogout failed, clearing localStorage', e);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                  }
                  try { clearTokens(); } catch (e) { console.warn('clearTokens failed', e); }
                  try { delete API.defaults.headers.common.Authorization; } catch (e) { console.warn('failed to delete default auth header', e); }

                  // Fire-and-forget backend logout
                  (async () => {
                    try { await apiLogout(); } catch (e) { console.warn('apiLogout failed', e); }
                  })();

                  await Swal.fire({ icon: 'success', title: 'Đã đăng xuất' , showConfirmButton: false, timer: 1000 });
                  navigate('/mainpage/HomePage');
                }}
                className="flex items-center gap-3 p-2 rounded hover:bg-red-500 w-full"
              >
                <LogOut /> {isSidebarOpen && "Đăng xuất"}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Trang Quản Trị EV Battery Swapper 🚀</h1>

        {activeView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold">Tổng số User</h3>
                <p className="text-3xl font-bold text-[#0028b8]">{userCount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold">Trạm hoạt động</h3>
                <p className="text-3xl font-bold text-[#0028b8]">{operationalStationCount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold">Giao dịch hôm nay</h3>
                <p className="text-3xl font-bold text-[#0028b8]">412</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">Danh sách trạm gần đây</h2>
              <div className="text-gray-500">(Demo static)</div>
            </div>
          </>
        )}

        {activeView === 'users' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Quản lý Users</h2>
                <p className="text-xs text-gray-500">Tổng số user{selectedRole === 'ALL' ? '' : ` (${selectedRole})`}: <span className="font-semibold">{userCount}</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Tìm theo email, họ, tên, CCCD hoặc số điện thoại"
                    className="border rounded pl-9 pr-3 py-1.5 text-sm w-89"
                  />
                  <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="role-select" className="text-sm text-gray-600">Role:</label>
                  <select
                    id="role-select"
                    value={selectedRole}
                    onChange={(e) => { setSelectedRole(e.target.value); loadUsers(e.target.value); }}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size-select" className="text-sm text-gray-600">Hiển thị:</label>
                  <select 
                    id="page-size-select"
                    value={pageSize} 
                    onChange={(e)=>{ setPageSize(Number.parseInt(e.target.value,10)||10); setCurrentPage(1); }} 
                    className="border rounded px-2 py-1 text-sm">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
                <button onClick={() => loadUsers()} className="px-3 py-1 rounded bg-[#0028b8] text-white hover:bg-[#0028b8]">Tải lại</button>
              </div>
            </div>

            {loading && <div className="text-gray-600">Đang tải...</div>}
            {error && <div className="text-red-600 mb-3">{error}</div>}

            {!loading && !error && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left border-collapse">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="p-3">User</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Họ</th>
                        <th className="p-3">Tên</th>
                        <th className="p-3">Ngày sinh</th>
                        <th className="p-3">Số CMND/CCCD</th>
                        <th className="p-3">Lần cuối đăng nhập</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const q = searchQuery.trim().toLowerCase();
                        const filtered = q ? users.filter(u =>
                          (u.email||'').toLowerCase().includes(q) ||
                          (u.firstName||'').toLowerCase().includes(q) ||
                          (u.lastName||'').toLowerCase().includes(q) ||
                          (u.identityNumber||'').toLowerCase().includes(q) ||
                          (u.phone||'').toLowerCase().includes(q)
                        ) : users;
                        const start = (currentPage - 1) * pageSize;
                        const pageItems = filtered.slice(start, start + pageSize);
                        return pageItems.map((u, idx) => (
                          <tr key={u.userId} className={"border-t " + (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') }>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const url = resolveAssetUrl(u.avatarUrl || '');
                                  const show = !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'));
                                  if (show) {
                                    return <img src={url} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>;
                                  }
                                  const initials = ((u.firstName?.[0]||u.email?.[0]||'?') + (u.lastName?.[0]||'')).toUpperCase();
                                  return <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold">{initials}</div>;
                                })()}
                                <div className="text-sm text-gray-800">{u.firstName || '-'} {u.lastName || ''}</div>
                              </div>
                            </td>
                            <td className="p-3 font-medium text-gray-800">{u.email}</td>
                            <td className="p-3">{u.phone || '-'}</td>
                            <td className="p-3">
                              <span className={`
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                                ${(() => {
                                  switch(u.role) {
                                    case 'ADMIN': return 'bg-red-100 text-red-700';
                                    case 'STAFF': return 'bg-blue-100 text-blue-700';
                                    default: return 'bg-green-100 text-green-700';
                                  }
                                })()}
                              `}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">{u.firstName || '-'}</td>
                            <td className="p-3">{u.lastName || '-'}</td>
                            <td className="p-3">{u.dateOfBirth || '-'}</td>
                            <td className="p-3">{u.identityNumber || '-'}</td>
                            <td className="p-3">{u.lastLogin || '-'}</td>
                          </tr>
                        ));
                      })()}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-6 text-gray-500 text-center">
                            Chưa có user nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Trang {currentPage} / {Math.max(1, Math.ceil((searchQuery? users.filter(u => (u.email||'').toLowerCase().includes(searchQuery.toLowerCase()) || (u.firstName||'').toLowerCase().includes(searchQuery.toLowerCase()) || (u.lastName||'').toLowerCase().includes(searchQuery.toLowerCase())) : users).length / pageSize))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={()=> setCurrentPage(p => Math.max(1, p-1))}
                    >
                      Trước
                    </button>
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      disabled={currentPage >= Math.ceil((searchQuery? users.filter(u => (u.email||'').toLowerCase().includes(searchQuery.toLowerCase()) || (u.firstName||'').toLowerCase().includes(searchQuery.toLowerCase()) || (u.lastName||'').toLowerCase().includes(searchQuery.toLowerCase())) : users).length / pageSize)}
                      onClick={()=> setCurrentPage(p => p+1)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeView === 'stations' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Quản lý Trạm</h2>
                <p className="text-xs text-gray-500">Tổng số trạm: <span className="font-semibold">{stations.length}</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="station-status-select" className="text-sm text-gray-600">Trạng thái:</label>
                  <select
                    id="station-status-select"
                    value={selectedStationStatus}
                    onChange={(e) => setSelectedStationStatus(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    Swal.fire({
                      title: 'Thêm trạm mới',
                      html: `
                        <div class="space-y-3">
                          <input id="name" class="w-full px-3 py-2 border rounded" placeholder="Tên trạm" />
                          <input id="address" class="w-full px-3 py-2 border rounded" placeholder="Địa chỉ" />
                          <input id="totalCapacity" type="number" class="w-full px-3 py-2 border rounded" placeholder="Sức chứa pin" />
                          <input id="totalSwapBays" type="number" class="w-full px-3 py-2 border rounded" placeholder="Số vị trí đổi pin" />
                          <input id="openingTime" class="w-full px-3 py-2 border rounded" placeholder="Giờ mở cửa (HH:mm)" />
                          <input id="closingTime" class="w-full px-3 py-2 border rounded" placeholder="Giờ đóng cửa (HH:mm)" />
                          <input id="contactPhone" class="w-full px-3 py-2 border rounded" placeholder="Số điện thoại liên hệ" />
                          <input id="contactEmail" class="w-full px-3 py-2 border rounded" placeholder="Email liên hệ" />
                          <textarea id="description" class="w-full px-3 py-2 border rounded" placeholder="Mô tả"></textarea>
                          <input id="imageUrl" class="w-full px-3 py-2 border rounded" placeholder="URL hình ảnh" />
                        </div>
                      `,
                      showCancelButton: true,
                      confirmButtonText: 'Thêm',
                      cancelButtonText: 'Hủy',
                      preConfirm: () => {
                        try {
                          const data = {
                            name: document.getElementById('name').value.trim(),
                            address: document.getElementById('address').value.trim(),
                            totalCapacity: parseInt(document.getElementById('totalCapacity').value),
                            totalSwapBays: parseInt(document.getElementById('totalSwapBays').value),
                            openingTime: document.getElementById('openingTime').value.trim(),
                            closingTime: document.getElementById('closingTime').value.trim(),
                            contactPhone: document.getElementById('contactPhone').value.trim(),
                            contactEmail: document.getElementById('contactEmail').value.trim(),
                            description: document.getElementById('description').value.trim(),
                            imageUrl: document.getElementById('imageUrl').value.trim()
                          };

                          // Validate empty fields
                          if (!data.name || !data.address || !data.totalCapacity || !data.totalSwapBays || 
                              !data.openingTime || !data.closingTime || !data.contactPhone || 
                              !data.contactEmail || !data.description || !data.imageUrl) {
                            Swal.showValidationMessage('Vui lòng điền đầy đủ thông tin');
                            return false;
                          }

                          // Validate time format (HH:mm)
                          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                          if (!timeRegex.test(data.openingTime) || !timeRegex.test(data.closingTime)) {
                            Swal.showValidationMessage('Giờ mở cửa và đóng cửa phải theo định dạng HH:mm (ví dụ: 08:00)');
                            return false;
                          }

                          // Validate numeric fields
                          if (data.totalCapacity <= 0 || data.totalSwapBays <= 0) {
                            Swal.showValidationMessage('Sức chứa và số vị trí đổi pin phải lớn hơn 0');
                            return false;
                          }

                          // Validate email format
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(data.contactEmail)) {
                            Swal.showValidationMessage('Email liên hệ không hợp lệ');
                            return false;
                          }

                          // Validate phone format (allow +84 or 0 prefix)
                          const phoneRegex = /^(\+84|0)\d{9,10}$/;
                          if (!phoneRegex.test(data.contactPhone)) {
                            Swal.showValidationMessage('Số điện thoại không hợp lệ (phải bắt đầu bằng +84 hoặc 0)');
                            return false;
                          }

                          console.log('Creating station with data:', data);
                          return createStation(data)
                            .then(() => {
                              loadStations();
                              return true;
                            })
                            .catch(error => {
                              console.error('Failed to create station:', error);
                              const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo trạm';
                              console.log('Error message:', errorMessage);
                              Swal.showValidationMessage(errorMessage);
                              return false;
                            });
                        } catch (error) {
                          console.error('Error in form validation:', error);
                          Swal.showValidationMessage('Có lỗi xảy ra khi xử lý form');
                          return false;
                        }
                      }
                    }).then((result) => {
                      if (result.isConfirmed) {
                        Swal.fire('Thành công', 'Đã thêm trạm mới', 'success');
                      }
                    });
                  }}
                  className="px-3 py-1 rounded bg-[#0028b8] text-white hover:bg-[#335cff]"
                >
                  Thêm trạm
                </button>
                <button 
                  onClick={() => loadStations()} 
                  className="px-3 py-1 rounded bg-[#0028b8] text-white hover:bg-[#335cff]"
                >
                  Tải lại
                </button>
              </div>
            </div>

            {loading && <div className="text-gray-600">Đang tải...</div>}
            {error && <div className="text-red-600 mb-3">{error}</div>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3">Trạm</th>
                      <th className="p-3">Địa chỉ</th>
                      <th className="p-3">Sức chứa</th>
                      <th className="p-3">Hiện có</th>
                      <th className="p-3">Vị trí đổi pin</th>
                      <th className="p-3">Vị trí trống</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Thời gian HĐ</th>
                      <th className="p-3">Liên hệ</th>
                      <th className="p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations
                      .filter(station => selectedStationStatus === 'ALL' || station.status === selectedStationStatus)
                      .map((station, idx) => (
                      <tr key={station.stationId} className={"border-t " + (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={station.imageUrl || '/placeholder.png'} 
                              alt={station.name} 
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <div className="font-medium">{station.name}</div>
                              <div className="text-xs text-gray-500">{station.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{station.address}</td>
                        <td className="p-3">{station.totalCapacity}</td>
                        <td className="p-3">{station.currentCapacity}</td>
                        <td className="p-3">{station.totalSwapBays}</td>
                        <td className="p-3">{station.idleSwapBays}</td>
                        <td className="p-3">
                          <select
                            value={station.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              const stationId = station?.id || station?.stationId;
                              console.log('Station object when changing status:', station);
                              if (!stationId) {
                                console.error('Station ID is missing:', station);
                                Swal.fire('Lỗi', 'Không tìm thấy ID của trạm. Vui lòng tải lại trang.', 'error');
                                return;
                              }
                              Swal.fire({
                                title: 'Xác nhận thay đổi',
                                text: `Bạn có chắc muốn thay đổi trạng thái trạm thành ${newStatus}?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Xác nhận',
                                cancelButtonText: 'Hủy'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  console.log('Updating status for station:', stationId, newStatus);
                                  changeStationStatus(stationId, newStatus)
                                    .then(() => {
                                      loadStations();
                                      Swal.fire('Thành công', 'Đã cập nhật trạng thái trạm', 'success');
                                    })
                                    .catch(error => {
                                      console.error('Failed to update station status:', error);
                                      const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
                                      console.error('Error details:', errorMsg);
                                      Swal.fire('Lỗi', errorMsg, 'error');
                                    });
                                }
                              });
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              station.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' : 
                              station.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' : 
                              station.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <option value="OPERATIONAL">OPERATIONAL</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="p-3">
                          {station.openingTime} - {station.closingTime}
                        </td>
                        <td className="p-3">
                          <div>{station.contactPhone}</div>
                          <div className="text-xs text-gray-500">{station.contactEmail}</div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              const stationId = station?.stationId || station?.id;
                              if (!stationId) {
                                console.error('Station ID is missing:', station);
                                Swal.fire('Lỗi', 'Không tìm thấy ID của trạm. Vui lòng tải lại trang.', 'error');
                                return;
                              }

                              Swal.fire({
                                title: 'Chỉnh sửa trạm',
                                html: `
                                  <div class="space-y-3">
                                    <input id="name" class="w-full px-3 py-2 border rounded" placeholder="Tên trạm" value="${station.name || ''}" />
                                    <input id="address" class="w-full px-3 py-2 border rounded" placeholder="Địa chỉ" value="${station.address || ''}" />
                                    <input id="totalCapacity" type="number" class="w-full px-3 py-2 border rounded" placeholder="Sức chứa pin" value="${station.totalCapacity || ''}" />
                                    <input id="totalSwapBays" type="number" class="w-full px-3 py-2 border rounded" placeholder="Số vị trí đổi pin" value="${station.totalSwapBays || ''}" />
                                    <input id="openingTime" class="w-full px-3 py-2 border rounded" placeholder="Giờ mở cửa (HH:mm)" value="${station.openingTime || ''}" />
                                    <input id="closingTime" class="w-full px-3 py-2 border rounded" placeholder="Giờ đóng cửa (HH:mm)" value="${station.closingTime || ''}" />
                                    <input id="contactPhone" class="w-full px-3 py-2 border rounded" placeholder="Số điện thoại liên hệ" value="${station.contactPhone || ''}" />
                                    <input id="contactEmail" class="w-full px-3 py-2 border rounded" placeholder="Email liên hệ" value="${station.contactEmail || ''}" />
                                    <textarea id="description" class="w-full px-3 py-2 border rounded" placeholder="Mô tả">${station.description || ''}</textarea>
                                    <input id="imageUrl" class="w-full px-3 py-2 border rounded" placeholder="URL hình ảnh" value="${station.imageUrl || ''}" />
                                  </div>
                                `,
                                showCancelButton: true,
                                confirmButtonText: 'Lưu',
                                cancelButtonText: 'Hủy',
                                preConfirm: () => {
                                  try {
                                    const data = {
                                      name: document.getElementById('name').value.trim(),
                                      address: document.getElementById('address').value.trim(),
                                      totalCapacity: parseInt(document.getElementById('totalCapacity').value),
                                      totalSwapBays: parseInt(document.getElementById('totalSwapBays').value),
                                      openingTime: document.getElementById('openingTime').value.trim(),
                                      closingTime: document.getElementById('closingTime').value.trim(),
                                      contactPhone: document.getElementById('contactPhone').value.trim(),
                                      contactEmail: document.getElementById('contactEmail').value.trim(),
                                      description: document.getElementById('description').value.trim(),
                                      imageUrl: document.getElementById('imageUrl').value.trim()
                                    };
    
                                    if (!data.name || !data.address || !data.totalCapacity || !data.totalSwapBays || 
                                        !data.openingTime || !data.closingTime || !data.contactPhone || 
                                        !data.contactEmail || !data.description || !data.imageUrl) {
                                      Swal.showValidationMessage('Vui lòng điền đầy đủ thông tin');
                                      return false;
                                    }
    
                                    // Validate numeric fields
                                    if (data.totalCapacity <= 0 || data.totalSwapBays <= 0) {
                                      Swal.showValidationMessage('Sức chứa và số vị trí đổi pin phải lớn hơn 0');
                                      return false;
                                    }
    
                                    // Validate email format
                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailRegex.test(data.contactEmail)) {
                                      Swal.showValidationMessage('Email liên hệ không hợp lệ');
                                      return false;
                                    }
    
                                    // Validate phone format (allow +84 or 0 prefix)
                                    const phoneRegex = /^(\+84|0)\d{9,10}$/;
                                    if (!phoneRegex.test(data.contactPhone)) {
                                      Swal.showValidationMessage('Số điện thoại không hợp lệ (phải bắt đầu bằng +84 hoặc 0)');
                                      return false;
                                    }

                                  if (!stationId) {
                                    console.error('Station object:', station);
                                    Swal.showValidationMessage('Không tìm thấy ID của trạm');
                                    return false;
                                  }

                                  console.log('Updating station:', stationId, data);
                                  return updateStation(stationId, data)
                                    .then(() => {
                                      loadStations();
                                      return true;
                                    })
                                    .catch(error => {
                                      console.error('Failed to update station:', error);
                                      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật trạm';
                                      console.log('Error message:', errorMessage);
                                      Swal.showValidationMessage(errorMessage);
                                      return false;
                                    });
                                  } catch (error) {
                                    console.error('Error in form validation:', error);
                                    Swal.showValidationMessage('Có lỗi xảy ra khi xử lý form');
                                    return false;
                                  }
                                }
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  Swal.fire('Thành công', 'Đã cập nhật thông tin trạm', 'success');
                                }
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stations.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-6 text-gray-500 text-center">
                          Chưa có trạm nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
