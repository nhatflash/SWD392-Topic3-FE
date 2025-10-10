import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { updateProfile, getCurrentProfile } from '../../../services/user';
import Swal from 'sweetalert2';

const EditProfile = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    identityNumber: '',
    dateOfBirth: '',
    avatarUrl: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      
      // Format date for input
      let formattedDate = '';
      if (profileData.dateOfBirth) {
        const date = new Date(profileData.dateOfBirth);
        formattedDate = date.toISOString().split('T')[0];
      }

      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        identityNumber: profileData.identityNumber || '',
        dateOfBirth: formattedDate,
        avatarUrl: profileData.avatarUrl || ''
      });

      if (profileData.avatarUrl) {
        setAvatarPreview(profileData.avatarUrl);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể tải thông tin profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // simple URL validator
  const isValidUrl = (value) => {
    try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Vui lòng nhập họ';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Vui lòng nhập tên';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone?.trim() && !/^\+?\d{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.identityNumber?.trim() && !/^\d{6,20}$/.test(formData.identityNumber.trim())) {
      newErrors.identityNumber = 'Số CMND/CCCD không hợp lệ';
    }

    if (formData.dateOfBirth) {
      const selectedDate = new Date(formData.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.dateOfBirth = 'Ngày sinh không được là ngày tương lai';
      }
    }

    if (formData.avatarUrl?.trim() && !isValidUrl(formData.avatarUrl.trim())) {
      newErrors.avatarUrl = 'Avatar URL không hợp lệ (yêu cầu http/https)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for API
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        identityNumber: formData.identityNumber?.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        avatarUrl: formData.avatarUrl || null
      };

      // No file upload; avatarUrl is provided directly by user as a URL

      const updated = await updateProfile(updateData);
      try {
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {}

      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Cập nhật profile thành công',
        timer: 1200,
      }).then(() => {
        navigate('/profile');
        setTimeout(() => window.location.reload(), 50);
      });
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể cập nhật profile'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0028b8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 flex">
      {/* Content chính */}
      <div className="flex-1 p-6 md:p-8">
        <div className="bg-white shadow-md rounded-xl overflow-hidden w-full">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa thông tin</h2>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
  
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              {/* Avatar Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {avatarPreview && (avatarPreview.startsWith('http://') || avatarPreview.startsWith('https://') || avatarPreview.startsWith('data:')) ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-gray-500">
                        {formData.firstName?.[0]?.toUpperCase() || '?'}
                        {formData.lastName?.[0]?.toUpperCase() || ''}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, avatarUrl: e.target.value }));
                        setAvatarPreview(e.target.value);
                        if (errors.avatarUrl) setErrors(prev => ({ ...prev, avatarUrl: '' }));
                      }}
                      placeholder="https://example.com/avatar.jpg"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                        errors.avatarUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.avatarUrl && (
                      <p className="text-red-500 text-sm mt-1">{errors.avatarUrl}</p>
                    )}
                  </div>
                </div>
              </div>
  
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Nhập họ"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Nhập tên"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
  
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
  
              {/* Phone + Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số CMND/CCCD
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    value={formData.identityNumber}
                    onChange={handleChange}
                    placeholder="Nhập số CMND/CCCD"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                      errors.identityNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.identityNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.identityNumber}</p>
                  )}
                </div>
              </div>
  
              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8] ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                )}
              </div>
  
              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default EditProfile;


