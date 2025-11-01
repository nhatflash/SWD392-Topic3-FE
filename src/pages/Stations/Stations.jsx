import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOperationalStations } from '../../services/station';

const Stations = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      // Trang public chỉ hiển thị trạm OPERATIONAL
      const data = await getOperationalStations(1, 100); // page=1, size=100 để lấy nhiều trạm
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load stations:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải danh sách trạm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = stations.filter(s => {
    const matchesQuery = !query || (s.name || '').toLowerCase().includes(query.toLowerCase());
    // Vì chỉ load OPERATIONAL rồi, nên filter status chỉ dùng để lọc trên client
    // Nhưng tất cả đều là OPERATIONAL nên statusFilter không có tác dụng
    return matchesQuery;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Danh sách Trạm</h1>
            <p className="text-sm text-gray-500">Tìm trạm, lọc trạng thái và xem thông tin nhanh.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded-md shadow-sm px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="6" />
            </svg>
            <input
              placeholder="Tìm theo tên trạm"
              className="outline-none text-sm w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="ml-2 text-xs text-gray-500">Xóa</button>
            )}
          </div>

          <button className="px-4 py-2 bg-[#0028b8] text-white rounded-md shadow hover:bg-[#335cff]" onClick={() => load()}>Tải lại</button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0028b8] rounded-full animate-spin" />
        </div>
      )}

      {error && <div className="text-red-600 mb-3">{error}</div>}

      {!loading && !error && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 && (
              <div className="col-span-full p-8 bg-white rounded shadow text-center text-gray-500">Không tìm thấy trạm nào.</div>
            )}

            {filtered.map((s, idx) => {
              const statusMap = {
                OPERATIONAL: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700', icon: '✅' },
                MAINTENANCE: { label: 'Bảo trì', color: 'bg-yellow-100 text-yellow-700', icon: '🛠️' },
                CLOSED: { label: 'Đã đóng', color: 'bg-red-100 text-red-700', icon: '⛔' },
              };
              const status = statusMap[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-700', icon: '' };
              return (
                <div key={s.stationId || s.id || idx} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="relative">
                    <img src={s.imageUrl || '/placeholder.png'} alt={s.name} className="w-full h-40 object-cover" />
                    <span className={`absolute top-3 right-3 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                      <span className="mr-1">{status.icon}</span>{status.label}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold truncate">{s.name}</h3>
                      {s.averageRating && (
                        <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                          <span className="text-yellow-600">⭐</span>
                          <span className="font-semibold text-yellow-700 text-sm">
                            {s.averageRating.rate ?? s.averageRating}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{s.description}</p>

                    <div className="mt-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Địa chỉ</div>
                          <div className="text-sm">{s.address}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Vị trí trống</div>
                          <div className="text-sm">{s.idleSwapBays}/{s.totalSwapBays}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <div>Số pin hiện có: <span className="font-semibold text-gray-700">{s.currentCapacity}</span></div>
                        <div>Liên hệ: {s.contactPhone}</div>
                        <div>{s.contactEmail}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <button
                        onClick={() => navigate(`/stations/${s.stationId || s.id}`)}
                        className="w-full px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#335cff] transition-colors text-sm font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stations;
