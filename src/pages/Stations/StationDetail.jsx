/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getStationById } from '../../services/station';
import { getStationStaff } from '../../services/stationStaff';
import { getAllBatteries, addNewBattery, getAllBatteryModels, updateBatteryModel } from '../../services/battery';

const StationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [staff, setStaff] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [batteryModels, setBatteryModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'staff', 'models'

  const loadStationDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load station details first
      const stationData = await getStationById(id);
      setStation(stationData);
      
      // Load staff, batteries, and battery models in parallel
      const [staffData, batteriesData, modelsData] = await Promise.all([
        getStationStaff(id).catch(() => []),
        getAllBatteries().catch(() => []),
        getAllBatteryModels().catch(() => [])
      ]);
      
      setStaff(staffData);
      
      // Filter batteries for this station
      // BE returns currentStationName field in BatteryResponse
      const stationBatteries = batteriesData.filter(b => {
        if (!b.currentStationName || !stationData.name) return false;

        const batteryStation = String(b.currentStationName).trim().toLowerCase();
        const currentStation = String(stationData.name).trim().toLowerCase();
        
        return batteryStation === currentStation;
      });
      
      console.log('Station name:', stationData.name);
      console.log('Total batteries:', batteriesData.length);
      console.log('Batteries at this station:', stationBatteries.length, stationBatteries);
      
      setBatteries(stationBatteries);
      setBatteryModels(modelsData);
    } catch (e) {
      console.error('Failed to load station details:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin trạm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadStationDetail();
    }
  }, [id]);

  const handleAddBattery = async () => {
    // Always refresh battery models before opening the modal to ensure latest options
    try {
      const latestModels = await getAllBatteryModels();
      setBatteryModels(latestModels);
    } catch (e) {
      console.error('Failed to refresh battery models before add battery:', e);
    }

    Swal.fire({
      title: 'Thêm pin mới',
      html: `
        <div class="space-y-3 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Số serial *</label>
            <input id="serialNumber" class="w-full px-3 py-2 border rounded" placeholder="VD: BAT-2024-001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Loại pin (Model) *</label>
            <select id="type" class="w-full px-3 py-2 border rounded">
              <option value="">Chọn loại pin</option>
              ${batteryModels.map(m => `<option value="${m.type}">${m.type} - ${m.manufacturer}</option>`).join('')}
            </select>
            <small class="text-gray-500">Chưa có model? <a href="#" id="createModelLink" class="text-blue-600 hover:underline">Tạo model mới</a></small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dung lượng (kWh) *</label>
            <input id="capacityKwh" type="number" min="1" class="w-full px-3 py-2 border rounded" placeholder="VD: 50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ngày sản xuất *</label>
            <input id="manufactureDate" type="date" class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ngày hết bảo hành *</label>
            <input id="warrantyExpiryDate" type="date" class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Giá pin (VND) *</label>
            <input id="rentalPrice" type="number" min="0" step="1000" class="w-full px-3 py-2 border rounded" placeholder="VD: 50000" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea id="notes" rows="2" class="w-full px-3 py-2 border rounded" placeholder="Ghi chú về pin (tùy chọn)"></textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: 'Thêm pin',
      cancelButtonText: 'Hủy',
      didOpen: () => {
        // Handle create model link click
        document.getElementById('createModelLink')?.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.close();
          handleCreateBatteryModel();
        });
      },
      preConfirm: () => {
        const serialNumber = document.getElementById('serialNumber').value.trim();
        const type = document.getElementById('type').value.trim();
        const capacityKwh = Number.parseInt(document.getElementById('capacityKwh').value, 10);
        const manufactureDate = document.getElementById('manufactureDate').value.trim();
        const warrantyExpiryDate = document.getElementById('warrantyExpiryDate').value.trim();
        const rentalPrice = document.getElementById('rentalPrice').value.trim();
        const notes = document.getElementById('notes').value.trim();

        // Validate
        if (!serialNumber) {
          Swal.showValidationMessage('Vui lòng nhập số serial');
          return false;
        }
        if (!type) {
          Swal.showValidationMessage('Vui lòng chọn loại pin');
          return false;
        }
        if (Number.isNaN(capacityKwh) || capacityKwh <= 0) {
          Swal.showValidationMessage('Dung lượng phải là số dương');
          return false;
        }
        if (!manufactureDate) {
          Swal.showValidationMessage('Vui lòng nhập ngày sản xuất');
          return false;
        }
        if (!warrantyExpiryDate) {
          Swal.showValidationMessage('Vui lòng nhập ngày hết bảo hành');
          return false;
        }
        if (!rentalPrice || Number(rentalPrice) < 0) {
          Swal.showValidationMessage('Vui lòng nhập Giá pin hợp lệ');
          return false;
        }

        // Validate warranty date > manufacture date
        if (new Date(warrantyExpiryDate) <= new Date(manufactureDate)) {
          Swal.showValidationMessage('Ngày hết bảo hành phải sau ngày sản xuất');
          return false;
        }

        const payload = {
          serialNumber,
          type,
          capacityKwh,
          manufactureDate,
          warrantyExpiryDate,
          rentalPrice,
          notes: notes || null
        };

        console.log('Adding battery:', payload);
        return addNewBattery(station.id, payload)
          .then(() => {
            loadStationDetail();
            return true;
          })
          .catch(error => {
            console.error('Failed to add battery:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi thêm pin';
            Swal.showValidationMessage(errorMsg);
            return false;
          });
      }
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire('Thành công!', 'Đã thêm pin mới', 'success');
      }
    });
  };

  const handleCreateBatteryModel = () => {
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

        const { defineBatteryModel } = await import('../../services/battery');
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
            loadStationDetail(); // Reload to get new models
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
        Swal.fire({
          title: 'Thành công!',
          text: 'Model pin mới đã được tạo. Bạn có muốn thêm pin ngay không?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Thêm pin',
          cancelButtonText: 'Đóng'
        }).then(res => {
          if (res.isConfirmed) {
            handleAddBattery();
          }
        });
      }
    });
  };

  const handleShowBatteryModels = async () => {
    let latestModels = batteryModels;
    try {
      latestModels = await getAllBatteryModels();
      setBatteryModels(latestModels);
      console.log('Loaded battery models:', latestModels);
      if (latestModels.length > 0) {
        console.log('First model structure:', latestModels[0]);
        console.log('Model ID field:', latestModels[0].batteryModelId || latestModels[0].id || latestModels[0].modelId);
      }
    } catch (e) {
      console.error('Failed to load battery models:', e);
    }

    const rows = (latestModels || []).map(m => {
      const modelId = m.modelId || m.batteryModelId || m.id;
      console.log('Mapping model:', m.type, 'with ID:', modelId);
      return `
      <tr>
        <td class="px-3 py-2 whitespace-nowrap font-mono text-sm">${m.type}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.manufacturer || ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.chemistry || ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.weightKg ?? ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.warrantyMonths ?? ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.maxChargePowerKwh ?? ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">${m.minSohThreshold ?? ''}</td>
        <td class="px-3 py-2 whitespace-nowrap text-sm">
          <button class="edit-model-btn text-blue-600 hover:underline" data-model-id="${modelId}">Sửa</button>
        </td>
      </tr>
    `;
    }).join('');

    Swal.fire({
      title: 'Danh sách Model pin',
      width: '800px',
      html: `
        <div class="text-left">
          <div class="mb-3 text-sm text-gray-600">Có ${latestModels?.length || 0} model</div>
          <div class="border rounded overflow-hidden">
            <table class="min-w-full text-left">
              <thead class="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2">Type</th>
                  <th class="px-3 py-2">Manufacturer</th>
                  <th class="px-3 py-2">Chemistry</th>
                  <th class="px-3 py-2">Weight (kg)</th>
                  <th class="px-3 py-2">Warranty (months)</th>
                  <th class="px-3 py-2">Max charge (kWh)</th>
                  <th class="px-3 py-2">Min SoH (%)</th>
                  <th class="px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="8" class="px-3 py-4 text-center text-gray-500">Chưa có model nào</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="mt-3 text-sm">
            Chưa có model phù hợp? <a href="#" id="createModelLinkList" class="text-blue-600 hover:underline">Tạo model mới</a>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Đóng',
      cancelButtonText: 'Hủy',
      didOpen: () => {
        document.getElementById('createModelLinkList')?.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.close();
          handleCreateBatteryModel();
        });
        // Attach edit handlers to all edit buttons
        document.querySelectorAll('.edit-model-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modelId = e.target.getAttribute('data-model-id');
            console.log('Edit button clicked, modelId:', modelId);
            console.log('Available models:', latestModels);
            const model = latestModels.find(m => 
              (m.modelId && m.modelId === modelId) || 
              (m.batteryModelId && m.batteryModelId === modelId) || 
              (m.id && m.id === modelId)
            );
            console.log('Found model:', model);
            if (model) {
              Swal.close();
              handleUpdateBatteryModel(model);
            } else {
              console.error('Model not found with ID:', modelId);
              console.error('Tried to match against fields: batteryModelId, id, modelId');
            }
          });
        });
      }
    });
  };

  const handleUpdateBatteryModel = (model) => {
    console.log('handleUpdateBatteryModel called with model:', model);
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
            <input id="manufacturer" class="w-full px-3 py-2 border rounded" placeholder="VD: CATL" value="${model.manufacturer || ''}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Công nghệ pin *</label>
            <input id="chemistry" class="w-full px-3 py-2 border rounded" placeholder="VD: Lithium Iron Phosphate" value="${model.chemistry || ''}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Trọng lượng (kg) *</label>
            <input id="weightKg" type="number" min="1" class="w-full px-3 py-2 border rounded" placeholder="VD: 300" value="${model.weightKg || ''}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bảo hành (tháng)</label>
            <input id="warrantyMonths" type="number" min="0" class="w-full px-3 py-2 border rounded" placeholder="VD: 60" value="${model.warrantyMonths || 0}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Công suất sạc tối đa (kWh)</label>
            <input id="maxChargePowerKwh" type="number" min="0" class="w-full px-3 py-2 border rounded" placeholder="VD: 100" value="${model.maxChargePowerKwh || 0}" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ngưỡng SoH tối thiểu (%)</label>
            <input id="minSohThreshold" type="number" min="0" max="100" step="0.1" class="w-full px-3 py-2 border rounded" placeholder="VD: 80" value="${model.minSohThreshold || ''}" />
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
        console.log('Updating model with ID:', modelId, 'Payload:', payload);
        
        if (!modelId) {
          Swal.showValidationMessage('Không tìm thấy ID của model');
          console.error('Model object:', model);
          return false;
        }

        return updateBatteryModel(modelId, payload)
          .then(() => {
            loadStationDetail(); // Reload to get updated models
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams(location.search);
            const from = params.get('from');
            if (from === 'stations') {
              navigate('/dashboard/admin?view=stations');
            } else {
              navigate(-1);
            }
          }}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!station) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            const params = new URLSearchParams(location.search);
            const from = params.get('from');
            if (from === 'stations') {
              navigate('/dashboard/admin?view=stations');
            } else {
              navigate(-1);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết trạm</h1>
          <p className="text-sm text-gray-500">Thông tin chi tiết và nhân viên của trạm</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'staff'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nhân viên ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'models'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Model ({batteryModels.length})
          </button>
        </nav>
      </div>

      {/* Tab Content: Station Information */}
      {activeTab === 'info' && (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {station.imageUrl && (
          <div className="relative h-64">
            <img 
              src={station.imageUrl} 
              alt={station.name}
              className="w-full h-full object-cover"
            />
            <span className={`absolute top-4 right-4 px-3 py-1 text-sm font-semibold rounded-full ${
              station.status === 'OPERATIONAL' 
                ? 'bg-green-100 text-green-700' 
                : station.status === 'MAINTENANCE' 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {station.status}
            </span>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold">{station.name}</h2>
            {station.averageRating && (
              <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm font-semibold">
                ⭐ {typeof station.averageRating === 'object' && station.averageRating.rate 
                  ? station.averageRating.rate 
                  : typeof station.averageRating === 'number' 
                  ? station.averageRating 
                  : '0'}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                <p className="text-gray-900">{station.address}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-gray-900">{station.description || 'Không có mô tả'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ mở cửa</label>
                  <p className="text-gray-900">{station.openingTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ đóng cửa</label>
                  <p className="text-gray-900">{station.closingTime}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổng dung lượng</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.totalCapacity} pin</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dung lượng hiện tại</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.currentCapacity} pin</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổng vị trí đổi</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.totalSwapBays}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Vị trí trống</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.idleSwapBays}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p className="text-gray-900">{station.contactPhone || 'Chưa có'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email liên hệ</label>
                <p className="text-gray-900">{station.contactEmail || 'Chưa có'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab Content: Staff Section */}
      {activeTab === 'staff' && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">
          Nhân viên trạm ({staff.length})
        </h3>
        
        {staff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Trạm này chưa có nhân viên
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s) => (
              <div key={s.staffId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {s.firstName} {s.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{s.staffEmail}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    s.status === 'FULL_TIME' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {s.status === 'FULL_TIME' ? 'Toàn thời gian' : 'Bán thời gian'}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày bắt đầu:</span>
                    <span>{new Date(s.attachedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lương:</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                      }).format(s.salary)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Tab Content: Models Section */}
      {activeTab === 'models' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Danh sách Model pin ({batteryModels.length})</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateBatteryModel}
                className="px-4 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors"
              >
                + Tạo model
              </button>
              <button
                onClick={handleAddBattery}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                + Thêm pin mới
              </button>
            </div>
          </div>

          {batteryModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có model nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chemistry</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty (months)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max charge (kWh)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min SoH (%)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batteryModels.map((m) => {
                    const modelId = m.modelId || m.batteryModelId || m.id;
                    return (
                      <tr key={modelId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-sm">{m.type}</td>
                        <td className="px-4 py-2 text-sm">{m.manufacturer || ''}</td>
                        <td className="px-4 py-2 text-sm">{m.chemistry || ''}</td>
                        <td className="px-4 py-2 text-sm">{m.weightKg ?? ''}</td>
                        <td className="px-4 py-2 text-sm">{m.warrantyMonths ?? ''}</td>
                        <td className="px-4 py-2 text-sm">{m.maxChargePowerKwh ?? ''}</td>
                        <td className="px-4 py-2 text-sm">{m.minSohThreshold ?? ''}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => handleUpdateBatteryModel(m)}
                            className="text-blue-600 hover:underline"
                          >
                            Sửa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationDetail;
