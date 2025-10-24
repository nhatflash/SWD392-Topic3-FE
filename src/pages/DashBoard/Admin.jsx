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

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [activeView, setActiveView] = useState('overview'); // overview | users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL'); // ALL | ADMIN | CUSTOMER | STAFF
  const [userCount, setUserCount] = useState(0);
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

  // Load user count on initial mount
  useEffect(() => {
    loadUserCount();
  }, []);

  // Ensure count refreshes when switching back to overview
  useEffect(() => {
    if (activeView === 'overview') {
      loadUserCount();
    }
  }, [activeView]);

  return (
    <div className="flex h-screen bg-gray-100">
      
      <aside
        className={`bg-[#00b894] text-white p-4 transition-all duration-300 ${
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
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d] w-full text-left"
              >
                <LayoutDashboard /> {isSidebarOpen && "Dashboard"}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveView('users'); loadUsers(); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d] w-full text-left"
              >
                <Users /> {isSidebarOpen && "Quản lý Users"}
              </button>
            </li>
            <li>
              <button
                onClick={() => Swal.fire({ icon: 'info', title: 'Chức năng đang phát triển', text: 'Quản lý trạm sẽ có sớm!' })}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d] w-full text-left"
              >
                <Battery /> {isSidebarOpen && "Trạm sạc/đổi pin"}
              </button>
            </li>
            <li>
              <button
                onClick={() => Swal.fire({ icon: 'info', title: 'Chức năng đang phát triển', text: 'Báo cáo sẽ có sớm!' })}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d] w-full text-left"
              >
                <FileBarChart /> {isSidebarOpen && "Báo cáo"}
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/mainpage/HomePage')}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d] w-full text-left"
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
                <p className="text-3xl font-bold text-[#00b894]">{userCount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold">Trạm hoạt động</h3>
                <p className="text-3xl font-bold text-[#00b894]">32</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-semibold">Giao dịch hôm nay</h3>
                <p className="text-3xl font-bold text-[#00b894]">412</p>
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
                <button onClick={() => loadUsers()} className="px-3 py-1 rounded bg-[#00b894] text-white hover:bg-[#009e7d]">Tải lại</button>
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
      </main>
    </div>
  );
};

export default Admin;
