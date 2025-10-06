import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { register as registerUser } from '../../services/auth';
import bgImage from '../../assets/login/login.png';

const Register = () => {

   const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    identityNumber: "",
    password: "",
    confirmPassword: "",
  });   

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };
    setFormData(nextForm);
    setErrors(prev => {
      const nextErrors = { ...prev };

      if (name === 'password') {
        if (!value) nextErrors.password = 'Vui lòng nhập mật khẩu';
        else if (value.length < 8) nextErrors.password = 'Mật khẩu phải có ít nhất 8 kí tự';
        else nextErrors.password = '';
        if (nextForm.confirmPassword && value !== nextForm.confirmPassword) {
          nextErrors.confirmPassword = 'Mật khẩu không khớp';
        } else {
          nextErrors.confirmPassword = '';
        }
      }

      if (name === 'confirmPassword') {
        if (!value) nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        else if (value !== nextForm.password) nextErrors.confirmPassword = 'Mật khẩu không khớp';
        else nextErrors.confirmPassword = '';
      }

      if (name === 'dateOfBirth') {
        if (!value) {
          nextErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate > today) {
            nextErrors.dateOfBirth = 'Ngày sinh không được là ngày tương lai';
          } else {
            nextErrors.dateOfBirth = '';
          }
        }
      }

      return nextErrors;
    });
  };

  const validationForm = () => {
    const newErrors = {};
    const { firstName, lastName, email, password, confirmPassword, dateOfBirth, identityNumber, phone } = formData;

    if (!firstName?.trim()) {
      newErrors.firstName = 'Vui lòng nhập họ';
    }

    if (!lastName?.trim()) {
      newErrors.lastName = 'Vui lòng nhập tên';
    }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password){
        newErrors.password = "Vui lòng nhập mật khẩu";
    }
  else if (password.length < 8){
    newErrors.password = "Mật khẩu phải có ít nhất 8 kí tự";
    }

    if (!confirmPassword){
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    }
    else if (password !== confirmPassword){
        newErrors.confirmPassword = "Mật khẩu và xác nhận mật khẩu không khớp"
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
    } else {
      const selectedDate = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (selectedDate > today) {
        newErrors.dateOfBirth = 'Ngày sinh không được là ngày tương lai';
      }
    }

    if (identityNumber?.trim() && !/^\d{6,20}$/.test(identityNumber.trim())) {
      newErrors.identityNumber = 'Số CMND/CCCD không hợp lệ';
    }
    if (phone?.trim() && !/^\+?\d{7,15}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors (newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationForm()) {
      setLoading(true);
        const payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone || null,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        identityNumber: formData.identityNumber || null,
      };

      registerUser(payload)
        .then(res => {
          setLoading(false);
          const message = res?.message || 'Đăng ký thành công';
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          }).then(() => {
            navigate('/login');
          });
        })
        .catch(err => {
          setLoading(false);
          if (err.fieldErrors) {
            setErrors(prev => ({ ...prev, ...err.fieldErrors }));
          } else {
            const msg = err.message || 'Đã có lỗi xảy ra';
            setErrors(prev => ({ ...prev, form: msg }));
            // show a nicer toast so the user immediately sees the error
            try {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch {}
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: msg,
              showConfirmButton: false,
              timer: 3500,
            });
          }
        });
    }
  };
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-xl" // wider form
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-[#0028b8]">
          Đăng ký
        </h2>
        <p className="text-center text-sm mb-6 text-gray-500">
          Tạo tài khoản để quản lý trạm sạc / rent-swap battery
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-gray-700">Họ</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-gray-700">Tên</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-gray-700">Ngày sinh</label>
            <input
              id="dateOfBirth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Identity Number */}
          <div>
            <label htmlFor="identityNumber" className="block text-gray-700">Số CMND/CCCD</label>
            <input
              id="identityNumber"
              type="text"
              name="identityNumber"
              value={formData.identityNumber}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            {errors.identityNumber && (
              <p className="text-red-500 text-sm">{errors.identityNumber}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700">Số điện thoại (tuỳ chọn)</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            placeholder="Ví dụ: +84901234567"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">Mật khẩu</label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pr-12 px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 bg-white p-1 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3-11-7 1.02-2.18 2.6-3.99 4.56-5.27M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.46 12C3.73 7.6 7.61 5 12 5s8.27 2.6 9.54 7c-1.27 4.4-5.15 7-9.54 7S3.73 16.4 2.46 12z" />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700">Xác nhận mật khẩu</label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pr-12 px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(s => !s)}
              aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 bg-white p-1 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3-11-7 1.02-2.18 2.6-3.99 4.56-5.27M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.46 12C3.73 7.6 7.61 5 12 5s8.27 2.6 9.54 7c-1.27 4.4-5.15 7-9.54 7S3.73 16.4 2.46 12z" />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0028b8] hover:bg-[#0028b8] text-white font-bold py-2 px-4 rounded-md transition-colors mb-4"
        >
          {loading ? "Đang đăng ký..." : "Register"}
        </button>

        <div className="text-center">
          <span className="text-gray-600 text-sm mr-1">Đã có tài khoản?</span>
          <Link
            to="/login"
            className="text-[#0028b8] font-semibold hover:underline text-sm"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register
