import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStaff, createStaff, updateStaffStatus, getStationStaff } from '../../../services/stationStaff';
import { getAllStations } from '../../../services/station';
import { useAuth } from '../../../context/AuthContext';

const StaffManagementForStaff = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    staffEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    identityNumber: '',
    avatarUrl: '',
    stationName: '',
    salary: 0,
    status: 'FULL_TIME',
    gender: 'MALE'
  });
  const [updateData, setUpdateData] = useState({
    salary: 0,
    status: 'FULL_TIME'
  });

  // Handle status update
  const handleStatusUpdate = async (staffId, salary, currentStatus = 'FULL_TIME') => {
    try {
      setLoading(true);
      setError('');
      await updateStaffStatus(staffId, { salary, status: currentStatus });
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không thể cập nhật lương');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening update form
  const handleOpenUpdateForm = (staff) => {
    console.log('Opening update form for staff:', staff);
    setSelectedStaff(staff);
    setUpdateData({
      salary: staff.salary,
      status: staff.status
    });
    setShowUpdateForm(true);
    console.log('showUpdateForm set to true');
  };

  // Handle update form submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStaff) return;
    
    try {
      setLoading(true);
      setError('');
      await updateStaffStatus(selectedStaff.staffId, updateData);
      setShowUpdateForm(false);
      setSelectedStaff(null);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra quyền STAFF
    if (user?.role !== 'STAFF') {
      setError('Bạn không có quyền thêm nhân viên');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const requestData = {
        staffEmail: formData.staffEmail,
        stationName: user.stationName || 'Trạm hiện tại',
        salary: Number(formData.salary),
        status: formData.status
      };
      
      await createStaff(requestData);
      setShowForm(false);
      setFormData({
        staffEmail: '',
        password: '',
        confirmPassword: '',
        phone: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        identityNumber: '',
        avatarUrl: '',
        stationName: '',
        salary: 0,
        status: 'FULL_TIME',
        gender: 'MALE'
      });
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không thể thêm nhân viên');
    } finally {
      setLoading(false);
    }
  };

  // Load staff and stations data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if user has STAFF role
      if (user?.role === 'STAFF') {
        // Try to get staff data for the station first
        if (user?.stationId) {
          const staffData = await getStationStaff(user.stationId);
          setStaff(staffData);
        } else {
          // If no stationId, get all staff as fallback
          const staffData = await getAllStaff();
          setStaff(staffData);
        }
        setStations([]); // Staff doesn't need stations list
      } else {
        // If not STAFF role, show error message
        setError('Bạn không có quyền truy cập trang này. Vui lòng liên hệ admin.');
        setStaff([]);
        setStations([]);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role, user?.stationId]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Quay lại"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Quản lý nhân viên trạm</h1>
              <p className="text-sm text-gray-500">Quản lý nhân viên các trạm sạc pin</p>
            </div>
          </div>
          {/* Chỉ STAFF role mới có quyền thêm nhân viên */}
          {user?.role === 'STAFF' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#00b894] text-white rounded-md shadow hover:bg-[#009e7d]"
            >
              Thêm nhân viên
            </button>
          )}
        </div>

        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}

        {/* Add Staff Form - Chỉ hiển thị khi STAFF có quyền */}
        {showForm && user?.role === 'STAFF' && (
          <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Thêm nhân viên mới</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email nhân viên *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.staffEmail}
                    onChange={(e) => setFormData({...formData, staffEmail: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="vit@gmail.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="Nguyễn Văn"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="A"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="0123456789"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CMND/CCCD
                  </label>
                  <input
                    type="text"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({...formData, identityNumber: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="Số CMND/CCCD"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Avatar
                  </label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạm *
                  </label>
                  <input
                    type="text"
                    value={user?.stationName || 'Trạm hiện tại'}
                    disabled
                    className="w-full p-2 border rounded bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nhân viên sẽ được thêm vào trạm của bạn</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="5000000"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái làm việc *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                  >
                    <option value="FULL_TIME">Toàn thời gian</option>
                    <option value="PART_TIME">Bán thời gian</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#00b894] text-white rounded hover:bg-[#009e7d] disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Staff Form */}
        {showUpdateForm && selectedStaff && (
          <div className="fixed inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cập nhật nhân viên</h2>
                <button
                  onClick={() => setShowUpdateForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lương
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={updateData.salary}
                    onChange={(e) => setUpdateData({...updateData, salary: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                    placeholder="Mức lương"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái làm việc
                  </label>
                  <select
                    required
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#00b894] outline-none"
                  >
                    <option value="FULL_TIME">Toàn thời gian</option>
                    <option value="PART_TIME">Bán thời gian</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#00b894] text-white rounded hover:bg-[#009e7d] disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff List */}
        {loading && !showForm ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Chưa có nhân viên nào.
              </div>
            ) : (
              staff.map((s) => (
                <div key={s.staffId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${s.status === 'FULL_TIME' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {s.status === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian'}
                      </span>
                      <button
                        onClick={() => handleOpenUpdateForm(s)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Cập nhật thông tin"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg">{s.firstName} {s.lastName}</h3>
                      <p className="text-sm text-gray-600">{s.email}</p>
                    </div>

                    <div className="text-sm text-gray-700">
                      <p className="font-medium">Trạm: {s.stationName}</p>
                      <p className="mb-1">Ngày bắt đầu: {new Date(s.attachedAt).toLocaleDateString('vi-VN')}</p>
                      <p>Lương: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.salary)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagementForStaff;