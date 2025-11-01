import React, { useEffect, useState } from 'react';
import { listVehicles, registerVehicle, deactivateVehicle, updateVehicle } from '../../../../services/vehicle';

const Vehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ vin: '', make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editForm, setEditForm] = useState({ make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
  const [editLock] = useState({ vin: true, batteryType: false });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách phương tiện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Normalize uppercase for VIN and batteryType to match BE validators
    if (name === 'vin' || name === 'batteryType') {
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      // Validate VIN
      const vin = (form.vin || '').toString().trim().toUpperCase();
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
      if (!vinRegex.test(vin)) {
        setError('VIN không hợp lệ (17 ký tự, không chứa I, O, Q).');
        setSaving(false);
        return;
      }

      // Validate year (>=2000 and <= current year + 1)
      const now = new Date().getFullYear();
      const yRaw = form.year?.toString().trim();
      const y = Number.parseInt(yRaw, 10);
      if (!Number.isInteger(y) || y < 2000 || y > now + 1) {
        setError(`Năm không hợp lệ (2000 - ${now + 1})`);
        setSaving(false);
        return;
      }

      // Validate capacity (integer >= 1)
      const capRaw = form.batteryCapacity?.toString().trim();
      const capacity = Number.parseInt(capRaw, 10);
      if (!Number.isInteger(capacity) || capacity < 1) {
        setError('Dung lượng pin phải là số nguyên dương');
        setSaving(false);
        return;
      }

      // Validate batteryType (uppercase pattern)
      const bt = (form.batteryType || '').toString().toUpperCase().trim();
      const btRegex = /^[A-Z]{2,4}-\d{2,3}$/;
      if (!btRegex.test(bt)) {
        setError('Loại pin không hợp lệ (ví dụ: LFP-60, NMC-100)');
        setSaving(false);
        return;
      }

      const payload = {
        vin,
        make: form.make.trim(),
        model: form.model.trim(),
        year: y,
        licensePlate: form.licensePlate.trim(),
        batteryType: bt,
        batteryCapacity: capacity,
      };

      await registerVehicle(payload);
      setForm({ vin: '', make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
      await load();
    } catch (e) {
      const msg = extractApiErrorMessage(e);
      if (msg.includes('Vin already exists')) {
        setError('VIN đã tồn tại.');
      } else if (msg.includes('License plate already exists')) {
        setError('Biển số đã tồn tại. Vui lòng nhập biển số khác.');
      } else if (msg.includes('Invalid VIN')) {
        setError('VIN không hợp lệ (17 ký tự, không chứa I, O, Q).');
      } else if (msg.includes('Invalid battery type')) {
        setError('Loại pin không hợp lệ (ví dụ: LFP-60, NMC-100).');
      } else {
        setError(msg || 'Không thể thêm phương tiện');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (vehicleId) => {
    try {
      await deactivateVehicle(vehicleId);
      await load();
    } catch (e) {
      setError(e?.message || 'Không thể xoá phương tiện');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: String(vehicle.year ?? ''),
      licensePlate: vehicle.licensePlate || '',
      batteryType: (vehicle.batteryType || '').toString(),
      batteryCapacity: vehicle.batteryCapacity?.toString() || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // Normalize batteryType to uppercase as BE validates uppercase pattern (e.g., LFP-60)
    if (name === 'batteryType') {
      setEditForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const extractApiErrorMessage = (err) => {
    // Try common API error shapes
    const data = err?.response?.data;
    if (data) {
      const payload = data.data || data;
      const message = data.message || payload.message || data.error || payload.error;
      if (message) return message;
    }
    return err?.message || 'Có lỗi xảy ra';
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      // Validations aligned with BE
      const now = new Date().getFullYear();

      // Year: integer >= 2000 and <= current year + 1
      const yRaw = editForm.year?.toString().trim();
      const y = Number.parseInt(yRaw, 10);
      if (!Number.isInteger(y) || y < 2000 || y > now + 1) {
        setError(`Năm không hợp lệ (2000 - ${now + 1})`);
        setSaving(false);
        return;
      }

      // Battery capacity: integer >= 1
      const capRaw = editForm.batteryCapacity?.toString().trim();
      const capacity = Number.parseInt(capRaw, 10);
      if (!Number.isInteger(capacity) || capacity < 1) {
        setError('Dung lượng pin phải là số nguyên dương');
        setSaving(false);
        return;
      }

      // Battery type: UPPER CASE and matches pattern ^[A-Z]{2,4}-\d{2,3}$
      const bt = (editForm.batteryType || '').toString().toUpperCase().trim();
      const btRegex = /^[A-Z]{2,4}-\d{2,3}$/;
      if (!btRegex.test(bt)) {
        setError('Loại pin không hợp lệ (ví dụ: LFP-60, NMC-100)');
        setSaving(false);
        return;
      }

      // Build payload with only changed fields (BE treats null/empty as skip)
      const original = editingVehicle || {};
      const payload = {};
      const norm = (v) => (v ?? '').toString().trim();
      if (norm(editForm.make) !== norm(original.make)) payload.make = norm(editForm.make);
      if (norm(editForm.model) !== norm(original.model)) payload.model = norm(editForm.model);
      if (y !== Number(original.year)) payload.year = y;
      if (norm(editForm.licensePlate) !== norm(original.licensePlate)) payload.licensePlate = norm(editForm.licensePlate);
      if (bt !== norm(original.batteryType).toUpperCase()) payload.batteryType = bt;
      if (capacity !== Number(original.batteryCapacity)) payload.batteryCapacity = capacity;

      // If nothing changed, short-circuit
      if (Object.keys(payload).length === 0) {
        setError('Không có thay đổi nào để cập nhật');
        setSaving(false);
        return;
      }

      await updateVehicle(editingVehicle.vehicleId || editingVehicle.id, payload);
      setEditingVehicle(null);
      setEditForm({ make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
      await load();
    } catch (e) {
      const msg = extractApiErrorMessage(e);
      // BE returns: "This vehicle has been used in swap transaction." for any update attempt
      if (msg.includes('This vehicle has been used in swap transaction')) {
        setError('Không thể cập nhật. Xe này đã từng tham gia giao dịch đổi pin.');
      } else if (msg.includes('License plate already exists')) {
        setError('Biển số đã tồn tại. Vui lòng nhập biển số khác.');
      } else if (msg.includes('Vin already exists')) {
        setError('VIN đã tồn tại.');
      } else if (msg.includes('Invalid battery type')) {
        setError('Loại pin không hợp lệ (ví dụ: LFP-60, NMC-100).');
      } else if (msg.includes('Invalid VIN')) {
        setError('VIN không hợp lệ (17 ký tự, không chứa I, O, Q).');
      } else {
        setError(msg || 'Không thể cập nhật phương tiện');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingVehicle(null);
    setEditForm({ make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
    setEditLock({ vin: false, batteryType: false });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Danh sách phương tiện</h3>
        {loading && <div className="text-gray-600">Đang tải...</div>}
        {error && <div className="text-red-600 mb-3">{error}</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">VIN</th>
                  <th className="p-2">Hãng</th>
                  <th className="p-2">Mẫu</th>
                  <th className="p-2">Năm</th>
                  <th className="p-2">Biển số</th>
                  <th className="p-2">Loại pin</th>
                  <th className="p-2">Dung lượng (kWh)</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.vehicleId} className="border-t">
                    <td className="p-2">{v.vin}</td>
                    <td className="p-2">{v.make}</td>
                    <td className="p-2">{v.model}</td>
                    <td className="p-2">{v.year}</td>
                    <td className="p-2">{v.licensePlate}</td>
                    <td className="p-2">{v.batteryType}</td>
                    <td className="p-2">{v.batteryCapacity}</td>
                    <td className="p-2">{v.isActive ? 'Ngưng hoạt động' : ' Hoạt động'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(v)} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100">Sửa</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-500">Chưa có phương tiện</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingVehicle ? (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Sửa phương tiện: {editingVehicle.vin}</h3>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* VIN chỉ hiển thị, không cho sửa */}
            <input value={editingVehicle.vin} disabled className="border rounded px-3 py-2 bg-gray-100" placeholder="VIN" />
            <input name="make" value={editForm.make} onChange={handleEditChange} placeholder="Hãng" className="border rounded px-3 py-2" required />
            <input name="model" value={editForm.model} onChange={handleEditChange} placeholder="Mẫu" className="border rounded px-3 py-2" required />
            <input name="year" value={editForm.year} onChange={handleEditChange} placeholder="Năm" type="number" className="border rounded px-3 py-2" required />
            <input name="licensePlate" value={editForm.licensePlate} onChange={handleEditChange} placeholder="Biển số" className="border rounded px-3 py-2" required />
            <input name="batteryType" value={editForm.batteryType} onChange={handleEditChange} placeholder="Loại pin (VD: LFP-60)" className="border rounded px-3 py-2" required disabled={editLock.batteryType} pattern="^[A-Za-z]{2,4}-\d{2,3}$" title="2-4 chữ cái + dấu gạch nối + 2-3 chữ số, ví dụ: LFP-60" />
            <input name="batteryCapacity" value={editForm.batteryCapacity} onChange={handleEditChange} placeholder="Dung lượng (kWh)" type="number" step="1" min="1" className="border rounded px-3 py-2" required />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                Hủy
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-[#0028b8] text-white hover:bg-[#001a8b] disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Thêm phương tiện</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="vin" value={form.vin} onChange={handleChange} placeholder="VIN" className="border rounded px-3 py-2" required pattern="^[A-HJ-NPR-Z0-9]{17}$" title="17 ký tự, chỉ gồm A-H, J-N, P, R-Z và số; không chứa I, O, Q" maxLength={17} />
            <input name="make" value={form.make} onChange={handleChange} placeholder="Hãng" className="border rounded px-3 py-2" required />
            <input name="model" value={form.model} onChange={handleChange} placeholder="Mẫu" className="border rounded px-3 py-2" required />
            <input name="year" value={form.year} onChange={handleChange} placeholder="Năm" type="number" className="border rounded px-3 py-2" required min={2000} max={new Date().getFullYear() + 1} />
            <input name="licensePlate" value={form.licensePlate} onChange={handleChange} placeholder="Biển số" className="border rounded px-3 py-2" required />
            <input name="batteryType" value={form.batteryType} onChange={handleChange} placeholder="Loại pin (VD: LFP-60)" className="border rounded px-3 py-2" required pattern="^[A-Za-z]{2,4}-\d{2,3}$" title="2-4 chữ cái + dấu gạch nối + 2-3 chữ số, ví dụ: LFP-60" />
            <input name="batteryCapacity" value={form.batteryCapacity} onChange={handleChange} placeholder="Dung lượng (kWh)" type="number" step="1" min="1" className="border rounded px-3 py-2" required />
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-[#0028b8] text-white hover:bg-[#001a8b] disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Thêm phương tiện'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Vehicle;



