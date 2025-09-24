import { useState } from 'react';
import { Link } from "react-router-dom";

const Register = () => {

   const [formData, setFormData] = useState({
    //fullName: "",
    userName: "",
    email: "",
    //phone: "",
    //address: "",
    password: "",
    confirmPassword: "",
  });   

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value} = e.target;
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === "password"){
        if (value.length < 6){
            setErrors (prev => ({
                ...prev,
                password: "Mật khẩu có ít nhất 6 kí tự"
            }));
        }
        else {
            setErrors (prev => ({
                ...prev,
                password: ""
            }))
        }
    }

    // kiểm tra confirmPassword có khớp với password ko
    if (formData.confirmPassword){
        if (value !== formData.confirmPassword){
            setErrors(prev => ({
                ...prev,
                confirmPassword: "Mật khâu không khớp"
            }));
        }
        else {
            setErrors(prev => ({
            ...prev,
            confirmPassword: ""
          }));
        }
    }

    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: "Mật khẩu không khớp"
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ""
        }));
      }
    }

  };

  const validationForm = () => {
    const newErrors = {};
    const {userName, email, password, confirmPassword} = formData;

    if (!userName.trim()){
        newErrors.userName = "Vui lòng nhập User Name";
    }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password){
        newErrors.password = "Vui lòng nhập mật khẩu";
    }
    else if (password.length < 6){
        newErrors.password = "Mật khẩu phải có ít nhất 6 kí tự";
    }

    if (!confirmPassword){
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    }
    else if (password !== confirmPassword){
        newErrors.confirmPassword = "Mật khẩu và xác nhận mật khẩu không khớp"
    }

    setErrors (newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationForm()) {
      setLoading(true);
      console.log("Dữ liệu form:", formData);
      setTimeout(() => setLoading(false), 1000);
    }
  };

  // Battery-related color: #00b894 (teal/green, like lithium battery)
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: '#00b894' }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-xl" // wider form
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-[#00b894]">
          Đăng ký
        </h2>
        <p className="text-center text-sm mb-6 text-gray-500">
          Tạo tài khoản để quản lý trạm sạc / rent-swap battery
        </p>

        {/* UserName */}
        <div className="mb-4">
          <label htmlFor="userName" className="block text-gray-700">User Name</label>
          <input
            id="userName"
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
          />
          {errors.userName && (
            <p className="text-red-500 text-sm">{errors.userName}</p>
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
            className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">Mật khẩu</label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00b894] hover:bg-[#009e7d] text-white font-bold py-2 px-4 rounded-md transition-colors mb-4"
        >
          {loading ? "Đang đăng ký..." : "Register"}
        </button>

        <div className="text-center">
          <span className="text-gray-600 text-sm mr-1">Đã có tài khoản?</span>
          <Link
            to="/login"
            className="text-[#00b894] font-semibold hover:underline text-sm"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register
