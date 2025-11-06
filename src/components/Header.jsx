import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import API, { logout as apiLogout } from '../services/auth';
import { resolveAssetUrl } from '../services/user';
import { getBatteryModels } from '../services/battery';

const Header = () => {
  const navigate = useNavigate();
  const { logout: contextLogout, user, isAuthenticated, hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allModels, setAllModels] = useState([]);
  const searchRef = useRef(null);

  // Load battery models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getBatteryModels();
        setAllModels(models || []);
      } catch (error) {
        console.error('Failed to load battery models:', error);
      }
    };
    loadModels();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Search models by compatible vehicles
    const results = allModels.filter(model => {
      if (!model.compatibleVehicles || model.compatibleVehicles.length === 0) {
        return false;
      }
      
      // Check if any compatible vehicle matches the search query
      return model.compatibleVehicles.some(vehicle => 
        vehicle.toLowerCase().includes(query)
      );
    });

    setSearchResults(results);
    setShowResults(true);
  }, [searchQuery, allModels]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {/* Nút Đặt lịch đổi pin cho Driver */}
          {hasRole?.('DRIVER') && (
            <button
              onClick={() => navigate('/driver/book-swap')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0028b8] text-white rounded-full shadow hover:bg-[#335cff] transition-colors text-sm"
              aria-label="Đặt lịch đổi pin"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đặt lịch đổi pin
            </button>
          )}
        </nav>
      </div>

      {/* Search Bar - Centered */}
      <div className="flex-1 max-w-xl mx-8 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm model pin phù hợp với xe (VD: VinFast VF8, Tesla Model 3...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            className="w-full px-4 py-2.5 pl-11 pr-10 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
          />
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-96 overflow-y-auto z-50 animate-fadeIn">
            {searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                  Tìm thấy {searchResults.length} model pin phù hợp
                </div>
                {searchResults.map((model, index) => (
                  <button
                    key={model.modelId || model.batteryModelId || index}
                    type="button"
                    className="w-full p-4 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 text-left"
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                      Swal.fire({
                        title: model.type,
                        html: `
                          <div class="text-left space-y-3">
                            <div class="bg-blue-50 p-3 rounded-lg">
                              <p class="font-semibold text-gray-700 mb-2">🏭 Nhà sản xuất:</p>
                              <p class="text-gray-900">${model.manufacturer}</p>
                            </div>
                            <div class="bg-green-50 p-3 rounded-lg">
                              <p class="font-semibold text-gray-700 mb-2">🔬 Công nghệ:</p>
                              <p class="text-gray-900">${model.chemistry}</p>
                            </div>
                            <div class="bg-purple-50 p-3 rounded-lg">
                              <p class="font-semibold text-gray-700 mb-2">🚗 Xe tương thích:</p>
                              <p class="text-gray-900">${model.compatibleVehicles?.join(', ') || 'Không có thông tin'}</p>
                            </div>
                          </div>
                        `,
                        icon: 'info',
                        confirmButtonColor: '#0028b8',
                        confirmButtonText: 'Đóng',
                        width: '600px'
                      });
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">⚡</div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">{model.type}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {model.manufacturer} • {model.chemistry}
                        </div>
                        {model.compatibleVehicles && model.compatibleVehicles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {model.compatibleVehicles.map((vehicle) => (
                              <span 
                                key={`${model.type}-${vehicle}`}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                              >
                                🚗 {vehicle}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-6xl mb-3">🔍</div>
                <p className="text-gray-600 font-medium">Không tìm thấy model pin phù hợp</p>
                <p className="text-sm text-gray-500 mt-2">Thử tìm với tên xe khác (VD: VinFast VF8, Tesla Model 3)</p>
              </div>
            )}
          </div>
        )}
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
    </header>
  );
};

export default Header;
