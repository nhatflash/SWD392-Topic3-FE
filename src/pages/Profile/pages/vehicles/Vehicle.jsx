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
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        vin: form.vin.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        licensePlate: form.licensePlate.trim(),
        batteryType: form.batteryType.trim(),
        batteryCapacity: Number(form.batteryCapacity),
      };
      await registerVehicle(payload);
      setForm({ vin: '', make: '', model: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
      await load();
    } catch (e) {
      setError(e?.message || 'Không thể thêm phương tiện');
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
      batteryType: vehicle.batteryType || '',
      batteryCapacity: vehicle.batteryCapacity || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // basic validations
      const y = Number(editForm.year);
      const now = new Date().getFullYear();
      if (!Number.isInteger(y) || y < 1980 || y > now + 1) {
        setError('Năm không hợp lệ (1980 - ' + (now + 1) + ')');
        setSaving(false);
        return;
      }
      const capacity = Number(editForm.batteryCapacity);
      if (!Number.isFinite(capacity) || capacity <= 0) {
        setError('Dung lượng pin phải là số dương');
        setSaving(false);
        return;
      }
      const payload = {
        make: editForm.make.trim(),
        model: editForm.model.trim(),
        year: y,
        licensePlate: editForm.licensePlate.trim(),
        batteryType: editForm.batteryType.trim(),
        batteryCapacity: capacity,
      };
      await updateVehicle(editingVehicle.id, payload);
      setEditingVehicle(null);
      setEditForm({ make: '', model: '', year: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
      await load();
    } catch (e) {
      setError(e?.message || 'Không thể cập nhật phương tiện');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingVehicle(null);
    setEditForm({ make: '', model: '', licensePlate: '', batteryType: '', batteryCapacity: '' });
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
                  <tr key={v.id} className="border-t">
                    <td className="p-2">{v.vin}</td>
                    <td className="p-2">{v.make}</td>
                    <td className="p-2">{v.model}</td>
                    <td className="p-2">{v.year}</td>
                    <td className="p-2">{v.licensePlate}</td>
                    <td className="p-2">{v.batteryType}</td>
                    <td className="p-2">{v.batteryCapacity}</td>
                    <td className="p-2">{v.isActive ? 'Ngưng' : 'Hoạt động'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(v)} className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100">Sửa</button>
                        <button onClick={() => handleDeactivate(v.id)} className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100">Xoá</button>
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
            <input name="make" value={editForm.make} onChange={handleEditChange} placeholder="Hãng" className="border rounded px-3 py-2" required />
            <input name="model" value={editForm.model} onChange={handleEditChange} placeholder="Mẫu" className="border rounded px-3 py-2" required />
            <input name="year" value={editForm.year} onChange={handleEditChange} placeholder="Năm" type="number" className="border rounded px-3 py-2" required />
            <input name="licensePlate" value={editForm.licensePlate} onChange={handleEditChange} placeholder="Biển số" className="border rounded px-3 py-2" required />
            <input name="batteryType" value={editForm.batteryType} onChange={handleEditChange} placeholder="Loại pin" className="border rounded px-3 py-2" required />
            <input name="batteryCapacity" value={editForm.batteryCapacity} onChange={handleEditChange} placeholder="Dung lượng (kWh)" type="number" step="0.1" className="border rounded px-3 py-2" required />
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
            <input name="vin" value={form.vin} onChange={handleChange} placeholder="VIN" className="border rounded px-3 py-2" required />
            <input name="make" value={form.make} onChange={handleChange} placeholder="Hãng" className="border rounded px-3 py-2" required />
            <input name="model" value={form.model} onChange={handleChange} placeholder="Mẫu" className="border rounded px-3 py-2" required />
            <input name="year" value={form.year} onChange={handleChange} placeholder="Năm" type="number" className="border rounded px-3 py-2" required />
            <input name="licensePlate" value={form.licensePlate} onChange={handleChange} placeholder="Biển số" className="border rounded px-3 py-2" required />
            <input name="batteryType" value={form.batteryType} onChange={handleChange} placeholder="Loại pin" className="border rounded px-3 py-2" required />
            <input name="batteryCapacity" value={form.batteryCapacity} onChange={handleChange} placeholder="Dung lượng (kWh)" type="number" step="0.1" className="border rounded px-3 py-2" required />
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



