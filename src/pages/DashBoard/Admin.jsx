import { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
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
import API, { logout as apiLogout, clearTokens } from '../../services/auth';
import { getUsers, getUsersByRole } from '../../services/admin';
import { resolveAssetUrl } from '../../services/user';
import { getAllStations, createStation, updateStation, changeStationStatus } from '../../services/station';
import { getAllBatteries, getAllBatteryModels, defineBatteryModel, updateBatteryModel, getMonitoringStats, getBatteryStateById } from '../../services/battery';
import BatteryDetailModal from '../../components/BatteryDetailModal';
import { recordSoHDataPoint } from '../../services/sohTracking';

const Admin = () => {
  const STORAGE_KEY = 'adminActiveView';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: contextLogout } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [activeView, setActiveView] = useState('overview'); // overview | users | stations | batteries
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [batteryModels, setBatteryModels] = useState([]);
  const [batteryTab, setBatteryTab] = useState('batteries'); // 'batteries' | 'models' | 'stats'
  const [selectedBatteryState, setSelectedBatteryState] = useState(null); // for detail modal
  const [monitoringStats, setMonitoringStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
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

  const loadBatteries = async () => {
    try {
      setLoading(true);
      setError('');
      const [batteriesData, modelsData] = await Promise.all([
        getAllBatteries(1).catch(() => []),
        getAllBatteryModels(1).catch(() => [])
      ]);
      console.log('Batteries loaded:', batteriesData);
      console.log('Battery models loaded:', modelsData);
      setBatteries(batteriesData);
      setBatteryModels(modelsData);
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách pin');
      console.error('Failed to load batteries:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitoringStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError('');
      const stats = await getMonitoringStats();
      setMonitoringStats(stats);
    } catch (e) {
      console.error('Failed to load monitoring stats:', e);
      setStatsError(e?.message || 'Không thể tải thống kê monitoring');
    } finally {
      setStatsLoading(false);
    }
  };

  // Open battery detail modal with realtime state
  const handleOpenBatteryDetail = async (battery) => {
    try {
      const state = await getBatteryStateById(battery.batteryId || battery.id);
      if (state?.stateOfHealth != null) {
        try { recordSoHDataPoint(state.batteryId, state.stateOfHealth, state.status); } catch {}
      }
      setSelectedBatteryState(state);
    } catch (e) {
      console.error('Failed to load battery realtime state:', e);
      Swal.fire('Lỗi', 'Không thể tải trạng thái realtime của pin', 'error');
    }
  };

  // Show static battery info (like Staff > Pin trong trạm detail)
  const handleViewBatteryInfo = (battery) => {
    Swal.fire({
      title: 'Chi tiết pin',
      width: '700px',
      html: `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số serial</label>
              <p class="text-gray-900 font-mono">${battery.serialNumber}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Loại pin</label>
              <p class="text-gray-900">${battery.type}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <p class="text-gray-900">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                  battery.status === 'FULL' ? 'bg-green-100 text-green-800' :
                  battery.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                  battery.status === 'CHARGING' ? 'bg-yellow-100 text-yellow-800' :
                  battery.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                  battery.status === 'FAULTY' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }">${battery.status}</span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạm hiện tại</label>
              <p class="text-gray-900">${battery.currentStationName || 'N/A'}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dung lượng</label>
              <p class="text-gray-900 font-semibold">${battery.capacityKwh} kWh</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mức sạc hiện tại</label>
              <p class="text-gray-900 font-semibold">${battery.currentChargePercentage || 0}%</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chu kỳ sạc</label>
              <p class="text-gray-900">${battery.totalChargeCycles || 0}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Lượt đổi</label>
              <p class="text-gray-900">${battery.totalSwapCount || 0}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ngày sản xuất</label>
              <p class="text-gray-900">${battery.manufactureDate || 'N/A'}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hết bảo hành</label>
              <p class="text-gray-900">${battery.warrantyExpiryDate || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Giá thuê</label>
            <p class="font-semibold text-green-600">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(battery.rentalPrice || 0)}</p>
          </div>

          ${battery.notes ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <p class="text-gray-900 text-sm italic">${battery.notes}</p>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Đóng',
      confirmButtonColor: '#0028b8'
    });
  };

  // Load initial data
  useEffect(() => {
    loadUserCount();
    loadStations();
  }, []);

  // Sync activeView with query param `view` when landing; default to overview on bare route
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    const allowed = ['overview', 'users', 'stations', 'batteries'];
    if (view && allowed.includes(view)) {
      if (view !== activeView) setActiveView(view);
      try { sessionStorage.setItem(STORAGE_KEY, view); } catch {}
    } else {
      // No view param present: always default to overview
      if (activeView !== 'overview') setActiveView('overview');
      try { sessionStorage.setItem(STORAGE_KEY, 'overview'); } catch {}
      navigate('/dashboard/admin?view=overview', { replace: true });
    }
  }, [location.search]);

  // Ensure counts refresh when switching back to overview
  useEffect(() => {
    if (activeView === 'overview') {
      loadUserCount();
      loadStations();
    }
  }, [activeView]);

  // Auto load stats when switching to batteries > stats tab
  useEffect(() => {
    if (activeView === 'batteries' && batteryTab === 'stats') {
      loadMonitoringStats();
    }
  }, [activeView, batteryTab]);

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
                onClick={() => { setActiveView('overview'); loadUserCount(); try{sessionStorage.setItem(STORAGE_KEY,'overview');}catch{} navigate('/dashboard/admin?view=overview', { replace: true }); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <LayoutDashboard /> {isSidebarOpen && "Dashboard"}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveView('users'); loadUsers(); try{sessionStorage.setItem(STORAGE_KEY,'users');}catch{} navigate('/dashboard/admin?view=users', { replace: true }); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <Users /> {isSidebarOpen && "Quản lý Users"}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setActiveView('stations'); loadStations(); try{sessionStorage.setItem(STORAGE_KEY,'stations');}catch{} navigate('/dashboard/admin?view=stations', { replace: true }); }}
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
                onClick={() => { setActiveView('batteries'); loadBatteries(); try{sessionStorage.setItem(STORAGE_KEY,'batteries');}catch{} navigate('/dashboard/admin?view=batteries', { replace: true }); }}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#335cff] w-full text-left"
              >
                <FileBarChart /> {isSidebarOpen && "Pin"}
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
                <h3 className="text-lg font-semibold">Tổng giao dịch</h3>
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
                        <div class="space-y-3 text-left">
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tên trạm *</label>
                            <input id="name" class="w-full px-3 py-2 border rounded" placeholder="VD: Trạm Quận 1" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                            <input id="address" class="w-full px-3 py-2 border rounded" placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sức chứa pin (số lượng) *</label>
                            <input id="totalCapacity" type="number" min="1" class="w-full px-3 py-2 border rounded" placeholder="VD: 100" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Số vị trí đổi pin *</label>
                            <input id="totalSwapBays" type="number" min="1" class="w-full px-3 py-2 border rounded" placeholder="VD: 5" />
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa *</label>
                              <input id="openingTime" class="w-full px-3 py-2 border rounded" placeholder="08:00" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa *</label>
                              <input id="closingTime" class="w-full px-3 py-2 border rounded" placeholder="22:00" />
                            </div>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                            <input id="contactPhone" class="w-full px-3 py-2 border rounded" placeholder="0123456789 hoặc +84123456789" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email liên hệ *</label>
                            <input id="contactEmail" type="email" class="w-full px-3 py-2 border rounded" placeholder="station@example.com" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                            <textarea id="description" rows="2" class="w-full px-3 py-2 border rounded" placeholder="Mô tả ngắn gọn về trạm"></textarea>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh *</label>
                            <input id="imageUrl" type="url" class="w-full px-3 py-2 border rounded" placeholder="https://example.com/image.jpg" />
                          </div>
                        </div>
                      `,
                      showCancelButton: true,
                      confirmButtonText: 'Thêm',
                      cancelButtonText: 'Hủy',
                      width: '600px',
                      preConfirm: () => {
                        try {
                          const name = document.getElementById('name').value.trim();
                          const address = document.getElementById('address').value.trim();
                          const totalCapacity = Number.parseInt(document.getElementById('totalCapacity').value, 10);
                          const totalSwapBays = Number.parseInt(document.getElementById('totalSwapBays').value, 10);
                          const openingTime = document.getElementById('openingTime').value.trim();
                          const closingTime = document.getElementById('closingTime').value.trim();
                          const contactPhone = document.getElementById('contactPhone').value.trim();
                          const contactEmail = document.getElementById('contactEmail').value.trim();
                          const description = document.getElementById('description').value.trim();
                          const imageUrl = document.getElementById('imageUrl').value.trim();

                          // Validate empty fields
                          if (!name) {
                            Swal.showValidationMessage('Vui lòng nhập tên trạm');
                            return false;
                          }
                          if (!address) {
                            Swal.showValidationMessage('Vui lòng nhập địa chỉ');
                            return false;
                          }
                          if (!description) {
                            Swal.showValidationMessage('Vui lòng nhập mô tả');
                            return false;
                          }
                          if (!imageUrl) {
                            Swal.showValidationMessage('Vui lòng nhập URL hình ảnh');
                            return false;
                          }

                          // Validate numeric fields
                          if (Number.isNaN(totalCapacity) || totalCapacity <= 0) {
                            Swal.showValidationMessage('Sức chứa pin phải là số nguyên dương');
                            return false;
                          }
                          if (Number.isNaN(totalSwapBays) || totalSwapBays <= 0) {
                            Swal.showValidationMessage('Số vị trí đổi pin phải là số nguyên dương');
                            return false;
                          }

                          // Validate time format (HH:mm)
                          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                          if (!timeRegex.test(openingTime)) {
                            Swal.showValidationMessage('Giờ mở cửa phải theo định dạng HH:mm (VD: 08:00)');
                            return false;
                          }
                          if (!timeRegex.test(closingTime)) {
                            Swal.showValidationMessage('Giờ đóng cửa phải theo định dạng HH:mm (VD: 22:00)');
                            return false;
                          }

                          // Validate email format
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(contactEmail)) {
                            Swal.showValidationMessage('Email không hợp lệ');
                            return false;
                          }

                          // Validate phone format (allow +84 or 0 prefix)
                          const phoneRegex = /^(\+84|0)\d{9,10}$/;
                          if (!phoneRegex.test(contactPhone)) {
                            Swal.showValidationMessage('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84)');
                            return false;
                          }

                          const data = {
                            name,
                            address,
                            totalCapacity,
                            totalSwapBays,
                            openingTime,
                            closingTime,
                            contactPhone,
                            contactEmail,
                            description,
                            imageUrl
                          };

                          console.log('Creating station with data:', data);
                          return createStation(data)
                            .then(() => {
                              loadStations();
                              return true;
                            })
                            .catch(error => {
                              console.error('Failed to create station:', error);
                              let errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo trạm';
                              
                              // Handle duplicate name error specifically
                              if (errorMessage.includes('already exists')) {
                                errorMessage = `Tên trạm "${name}" đã tồn tại. Vui lòng chọn tên khác.`;
                              }
                              
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
                      <th className="p-3">Rating</th>
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
                        <td className="p-3">
                          {station.averageRating ? (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="font-semibold">
                                {typeof station.averageRating === 'object' && station.averageRating.rate 
                                  ? station.averageRating.rate 
                                  : typeof station.averageRating === 'number' 
                                  ? station.averageRating 
                                  : '0'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/admin/station/${station.id || station.stationId}?from=stations`)}
                              className="text-[#155dfc] hover:text-[#193cb8] font-medium"
                            >
                              Xem chi tiết
                            </button>
                            <span className="text-gray-300">|</span>
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
                                    <div class="space-y-3 text-left">
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Tên trạm *</label>
                                        <input id="name" class="w-full px-3 py-2 border rounded" placeholder="VD: Trạm Quận 1" value="${station.name || ''}" />
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                                        <input id="address" class="w-full px-3 py-2 border rounded" placeholder="VD: 123 Nguyễn Huệ, Q1" value="${station.address || ''}" />
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Sức chứa pin *</label>
                                        <input id="totalCapacity" type="number" min="1" class="w-full px-3 py-2 border rounded" value="${station.totalCapacity || ''}" />
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Số vị trí đổi pin *</label>
                                        <input id="totalSwapBays" type="number" min="1" class="w-full px-3 py-2 border rounded" value="${station.totalSwapBays || ''}" />
                                      </div>
                                      <div class="grid grid-cols-2 gap-2">
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa *</label>
                                          <input id="openingTime" class="w-full px-3 py-2 border rounded" placeholder="08:00" value="${station.openingTime || ''}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa *</label>
                                          <input id="closingTime" class="w-full px-3 py-2 border rounded" placeholder="22:00" value="${station.closingTime || ''}" />
                                        </div>
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                                        <input id="contactPhone" class="w-full px-3 py-2 border rounded" placeholder="0123456789" value="${station.contactPhone || ''}" />
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Email liên hệ *</label>
                                        <input id="contactEmail" type="email" class="w-full px-3 py-2 border rounded" value="${station.contactEmail || ''}" />
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                                        <textarea id="description" rows="2" class="w-full px-3 py-2 border rounded">${station.description || ''}</textarea>
                                      </div>
                                      <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh *</label>
                                        <input id="imageUrl" type="url" class="w-full px-3 py-2 border rounded" value="${station.imageUrl || ''}" />
                                      </div>
                                    </div>
                                  `,
                                  showCancelButton: true,
                                  confirmButtonText: 'Lưu',
                                  cancelButtonText: 'Hủy',
                                  width: '600px',
                                  preConfirm: () => {
                                    try {
                                      const name = document.getElementById('name').value.trim();
                                      const address = document.getElementById('address').value.trim();
                                      const totalCapacity = Number.parseInt(document.getElementById('totalCapacity').value, 10);
                                      const totalSwapBays = Number.parseInt(document.getElementById('totalSwapBays').value, 10);
                                      const openingTime = document.getElementById('openingTime').value.trim();
                                      const closingTime = document.getElementById('closingTime').value.trim();
                                      const contactPhone = document.getElementById('contactPhone').value.trim();
                                      const contactEmail = document.getElementById('contactEmail').value.trim();
                                      const description = document.getElementById('description').value.trim();
                                      const imageUrl = document.getElementById('imageUrl').value.trim();
      
                                      // Validate empty fields
                                      if (!name) {
                                        Swal.showValidationMessage('Vui lòng nhập tên trạm');
                                        return false;
                                      }
                                      if (!address) {
                                        Swal.showValidationMessage('Vui lòng nhập địa chỉ');
                                        return false;
                                      }
                                      if (!description) {
                                        Swal.showValidationMessage('Vui lòng nhập mô tả');
                                        return false;
                                      }
                                      if (!imageUrl) {
                                        Swal.showValidationMessage('Vui lòng nhập URL hình ảnh');
                                        return false;
                                      }
      
                                      // Validate numeric fields
                                      if (Number.isNaN(totalCapacity) || totalCapacity <= 0) {
                                        Swal.showValidationMessage('Sức chứa pin phải là số nguyên dương');
                                        return false;
                                      }
                                      if (Number.isNaN(totalSwapBays) || totalSwapBays <= 0) {
                                        Swal.showValidationMessage('Số vị trí đổi pin phải là số nguyên dương');
                                        return false;
                                      }

                                      // Validate time format
                                      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                                      if (!timeRegex.test(openingTime)) {
                                        Swal.showValidationMessage('Giờ mở cửa phải theo định dạng HH:mm (VD: 08:00)');
                                        return false;
                                      }
                                      if (!timeRegex.test(closingTime)) {
                                        Swal.showValidationMessage('Giờ đóng cửa phải theo định dạng HH:mm (VD: 22:00)');
                                        return false;
                                      }
      
                                      // Validate email format
                                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                      if (!emailRegex.test(contactEmail)) {
                                        Swal.showValidationMessage('Email không hợp lệ');
                                        return false;
                                      }
      
                                      // Validate phone format (allow +84 or 0 prefix)
                                      const phoneRegex = /^(\+84|0)\d{9,10}$/;
                                      if (!phoneRegex.test(contactPhone)) {
                                        Swal.showValidationMessage('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84)');
                                        return false;
                                      }

                                      const data = {
                                        name,
                                        address,
                                        totalCapacity,
                                        totalSwapBays,
                                        openingTime,
                                        closingTime,
                                        contactPhone,
                                        contactEmail,
                                        description,
                                        imageUrl
                                      };

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
                                        let errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật trạm';
                                        
                                        // Handle duplicate name error
                                        if (errorMessage.includes('already exists')) {
                                          errorMessage = `Tên trạm "${name}" đã tồn tại. Vui lòng chọn tên khác.`;
                                        }
                                        
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
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Sửa
                            </button>
                          </div>
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

        {/* Batteries Management View */}
        {activeView === 'batteries' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Quản lý Pin</h2>
            
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-6">
                <button
                  onClick={() => setBatteryTab('batteries')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    batteryTab === 'batteries'
                      ? 'border-[#0028b8] text-[#0028b8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Danh sách Pin ({batteries.length})
                </button>
                <button
                  onClick={() => setBatteryTab('models')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    batteryTab === 'models'
                      ? 'border-[#0028b8] text-[#0028b8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Battery Models ({batteryModels.length})
                </button>
                <button
                  onClick={() => setBatteryTab('stats')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    batteryTab === 'stats'
                      ? 'border-[#0028b8] text-[#0028b8]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Realtime Stats
                </button>
              </nav>
            </div>

            {/* Batteries List Tab */}
            {batteryTab === 'batteries' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
                  </div>
                ) : batteries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <p>Chưa có pin nào trong hệ thống</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số serial</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạm hiện tại</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dung lượng</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức sạc</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá thuê</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batteries.map((battery) => (
                          <tr key={battery.batteryId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">{battery.serialNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{battery.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{battery.currentStationName || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                battery.status === 'FULL' ? 'bg-green-100 text-green-800' :
                                battery.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                                battery.status === 'CHARGING' ? 'bg-yellow-100 text-yellow-800' :
                                battery.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                                battery.status === 'FAULTY' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {battery.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{battery.capacityKwh} kWh</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{battery.currentChargePercentage || 0}%</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(battery.rentalPrice || 0)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenBatteryDetail(battery)}
                                  className="px-3 py-1.5 bg-[#0028b8] text-white rounded hover:bg-[#001a8b] transition-colors"
                                >
                                  Giám sát Pin
                                </button>
                                <button
                                  onClick={() => handleViewBatteryInfo(battery)}
                                  className="px-3 py-1.5 bg-[#0028b8] text-white rounded hover:bg-[#001a8b] transition-colors"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Battery Models Tab */}
            {batteryTab === 'models' && (
              <div>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Tạo Battery Model mới',
                        html: `
                          <div class="space-y-3 text-left">
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Loại pin (Type) *</label>
                              <input id="modelType" class="w-full px-3 py-2 border rounded" placeholder="VD: LFP-50" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Nhà sản xuất *</label>
                              <input id="manufacturer" class="w-full px-3 py-2 border rounded" placeholder="VD: CATL" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Công nghệ pin *</label>
                              <input id="chemistry" class="w-full px-3 py-2 border rounded" placeholder="VD: Lithium Iron Phosphate" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Trọng lượng (kg) *</label>
                              <input id="weightKg" type="number" min="1" class="w-full px-3 py-2 border rounded" placeholder="VD: 300" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Bảo hành (tháng)</label>
                              <input id="warrantyMonths" type="number" min="0" class="w-full px-3 py-2 border rounded" placeholder="VD: 60" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Công suất sạc tối đa (kWh)</label>
                              <input id="maxChargePowerKwh" type="number" min="0" class="w-full px-3 py-2 border rounded" placeholder="VD: 100" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Ngưỡng SoH tối thiểu (%)</label>
                              <input id="minSohThreshold" type="number" min="0" max="100" step="0.1" class="w-full px-3 py-2 border rounded" placeholder="VD: 80" />
                            </div>
                          </div>
                        `,
                        width: '600px',
                        showCancelButton: true,
                        confirmButtonText: 'Tạo model',
                        cancelButtonText: 'Hủy',
                        preConfirm: async () => {
                          const type = document.getElementById('modelType').value.trim();
                          const manufacturer = document.getElementById('manufacturer').value.trim();
                          const chemistry = document.getElementById('chemistry').value.trim();
                          const weightKg = Number.parseInt(document.getElementById('weightKg').value, 10);
                          const warrantyMonths = Number.parseInt(document.getElementById('warrantyMonths').value, 10) || 0;
                          const maxChargePowerKwh = Number.parseInt(document.getElementById('maxChargePowerKwh').value, 10) || 0;
                          const minSohThreshold = Number(document.getElementById('minSohThreshold').value) || null;

                          if (!type) {
                            Swal.showValidationMessage('Vui lòng nhập loại pin');
                            return false;
                          }
                          if (!manufacturer) {
                            Swal.showValidationMessage('Vui lòng nhập nhà sản xuất');
                            return false;
                          }
                          if (!chemistry) {
                            Swal.showValidationMessage('Vui lòng nhập công nghệ pin');
                            return false;
                          }
                          if (Number.isNaN(weightKg) || weightKg <= 0) {
                            Swal.showValidationMessage('Trọng lượng phải là số dương');
                            return false;
                          }

                          const payload = {
                            type,
                            manufacturer,
                            chemistry,
                            weightKg,
                            warrantyMonths,
                            maxChargePowerKwh,
                            minSohThreshold
                          };

                          return defineBatteryModel(payload)
                            .then(() => {
                              loadBatteries();
                              return true;
                            })
                            .catch(error => {
                              console.error('Failed to create battery model:', error);
                              let errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
                              if (errorMsg.includes('already exists')) {
                                errorMsg = `Loại pin "${type}" đã tồn tại`;
                              }
                              Swal.showValidationMessage(errorMsg);
                              return false;
                            });
                        }
                      }).then(result => {
                        if (result.isConfirmed) {
                          Swal.fire('Thành công!', 'Model pin mới đã được tạo', 'success');
                        }
                      });
                    }}
                    className="px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors"
                  >
                    + Tạo model mới
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
                  </div>
                ) : batteryModels.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Chưa có model nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chemistry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty (months)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max charge (kWh)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min SoH (%)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batteryModels.map((model, idx) => (
                          <tr key={model.modelId || model.batteryModelId || model.id || `model-${idx}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">{model.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.manufacturer}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.chemistry}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.weightKg}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.warrantyMonths || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.maxChargePowerKwh || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{model.minSohThreshold || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Cập nhật Battery Model',
                                    html: `
                                      <div class="space-y-3 text-left">
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Loại pin (Type) *</label>
                                          <input id="modelType" class="w-full px-3 py-2 border rounded bg-gray-100" value="${model.type}" readonly />
                                          <small class="text-gray-500">Type không thể sửa</small>
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Nhà sản xuất *</label>
                                          <input id="manufacturer" class="w-full px-3 py-2 border rounded" value="${model.manufacturer || ''}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Công nghệ pin *</label>
                                          <input id="chemistry" class="w-full px-3 py-2 border rounded" value="${model.chemistry || ''}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Trọng lượng (kg) *</label>
                                          <input id="weightKg" type="number" min="1" class="w-full px-3 py-2 border rounded" value="${model.weightKg || ''}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Bảo hành (tháng)</label>
                                          <input id="warrantyMonths" type="number" min="0" class="w-full px-3 py-2 border rounded" value="${model.warrantyMonths || 0}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Công suất sạc tối đa (kWh)</label>
                                          <input id="maxChargePowerKwh" type="number" min="0" class="w-full px-3 py-2 border rounded" value="${model.maxChargePowerKwh || 0}" />
                                        </div>
                                        <div>
                                          <label class="block text-sm font-medium text-gray-700 mb-1">Ngưỡng SoH tối thiểu (%)</label>
                                          <input id="minSohThreshold" type="number" min="0" max="100" step="0.1" class="w-full px-3 py-2 border rounded" value="${model.minSohThreshold || ''}" />
                                        </div>
                                      </div>
                                    `,
                                    width: '600px',
                                    showCancelButton: true,
                                    confirmButtonText: 'Cập nhật',
                                    cancelButtonText: 'Hủy',
                                    preConfirm: async () => {
                                      const manufacturer = document.getElementById('manufacturer').value.trim();
                                      const chemistry = document.getElementById('chemistry').value.trim();
                                      const weightKg = Number.parseInt(document.getElementById('weightKg').value, 10);
                                      const warrantyMonths = Number.parseInt(document.getElementById('warrantyMonths').value, 10) || 0;
                                      const maxChargePowerKwh = Number.parseInt(document.getElementById('maxChargePowerKwh').value, 10) || 0;
                                      const minSohThreshold = Number(document.getElementById('minSohThreshold').value) || null;

                                      if (!manufacturer) {
                                        Swal.showValidationMessage('Vui lòng nhập nhà sản xuất');
                                        return false;
                                      }
                                      if (!chemistry) {
                                        Swal.showValidationMessage('Vui lòng nhập công nghệ pin');
                                        return false;
                                      }
                                      if (Number.isNaN(weightKg) || weightKg <= 0) {
                                        Swal.showValidationMessage('Trọng lượng phải là số dương');
                                        return false;
                                      }

                                      const payload = {
                                        manufacturer,
                                        chemistry,
                                        weightKg,
                                        warrantyMonths,
                                        maxChargePowerKwh,
                                        minSohThreshold
                                      };

                                      const modelId = model.modelId || model.batteryModelId || model.id;
                                      if (!modelId) {
                                        Swal.showValidationMessage('Không tìm thấy ID của model');
                                        return false;
                                      }

                                      return updateBatteryModel(modelId, payload)
                                        .then(() => {
                                          loadBatteries();
                                          return true;
                                        })
                                        .catch(error => {
                                          console.error('Failed to update battery model:', error);
                                          const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
                                          Swal.showValidationMessage(errorMsg);
                                          return false;
                                        });
                                    }
                                  }).then(result => {
                                    if (result.isConfirmed) {
                                      Swal.fire('Thành công!', 'Model đã được cập nhật', 'success');
                                    }
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Sửa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Monitoring Stats Tab */}
            {batteryTab === 'stats' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">SSE Monitoring Stats</h3>
                    <p className="text-sm text-gray-500">Thống kê kết nối realtime của hệ thống</p>
                  </div>
                  <button
                    onClick={loadMonitoringStats}
                    className="px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors"
                  >
                    🔄 Làm mới
                  </button>
                </div>

                {statsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">{statsError}</div>
                )}

                {statsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
                  </div>
                ) : !monitoringStats ? (
                  <div className="text-gray-500">Chưa có dữ liệu</div>
                ) : (
                  <div className="space-y-6">
                    {/* Quick summary cards if common fields exist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {typeof monitoringStats.totalConnections !== 'undefined' && (
                        <div className="bg-white rounded-lg shadow p-4">
                          <p className="text-sm text-gray-500">Tổng kết nối</p>
                          <p className="text-2xl font-bold">{monitoringStats.totalConnections}</p>
                        </div>
                      )}
                      {typeof monitoringStats.activeEmitters !== 'undefined' && (
                        <div className="bg-white rounded-lg shadow p-4">
                          <p className="text-sm text-gray-500">Emitters đang hoạt động</p>
                          <p className="text-2xl font-bold">{monitoringStats.activeEmitters}</p>
                        </div>
                      )}
                      {typeof monitoringStats.connectedStations !== 'undefined' && (
                        <div className="bg-white rounded-lg shadow p-4">
                          <p className="text-sm text-gray-500">Số trạm có kết nối</p>
                          <p className="text-2xl font-bold">{monitoringStats.connectedStations}</p>
                        </div>
                      )}
                      {typeof monitoringStats.uptimeSeconds !== 'undefined' && (
                        <div className="bg-white rounded-lg shadow p-4">
                          <p className="text-sm text-gray-500">Uptime (giây)</p>
                          <p className="text-2xl font-bold">{monitoringStats.uptimeSeconds}</p>
                        </div>
                      )}
                    </div>

                    {/* Per station table if provided */}
                    {(Array.isArray(monitoringStats.perStation) || Array.isArray(monitoringStats.stationConnections)) && (
                      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạm</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số kết nối</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(monitoringStats.perStation || monitoringStats.stationConnections).map((row, idx) => (
                              <tr key={row.stationId || idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{row.stationName || row.stationId || 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{row.connections || row.count || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Fallback raw JSON */}
                    <div className="bg-gray-50 border rounded p-4">
                      <p className="text-sm font-semibold mb-2">Raw stats</p>
                      <pre className="text-xs overflow-auto">{JSON.stringify(monitoringStats, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Battery Detail Modal (Admin) */}
        {selectedBatteryState && (
          <BatteryDetailModal
            batteryState={selectedBatteryState}
            stationId={selectedBatteryState?.currentStationId}
            enableRealtime={true}
            onClose={() => setSelectedBatteryState(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Admin;
