import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { login as loginUser, getAccessToken, getRefreshToken } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import bgImage from '../../assets/login/login.png';

const Login = () => {

    const [formData, setFormData] = useState({ email: "" , password: "" });
    const [loading, setloading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const validationForm = () => {
        if (!formData.email || !formData.password){
            Swal.fire({ icon: 'error', title: 'Thiếu thông tin', text: 'Vui lòng nhập Email và Password' });
            return false;
        }
        return true;
    }

    const { login: authLogin, hasRole } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validationForm()) return;

        setloading(true);
        const loadingAlert = Swal.fire({
            title: 'Đang đăng nhập...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            await loginUser({ email: formData.email, password: formData.password });
            loadingAlert.close();
            
        
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();
            authLogin(null, { accessToken, refreshToken });

            await Swal.fire({ icon: 'success', title: 'Đăng nhập thành công', showConfirmButton: false, timer: 1200 });
            
            // Get role from token directly for immediate redirect
            const token = getAccessToken();
            let userRole = null;
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userRole = payload.role;
              } catch (e) {
                console.warn('Failed to parse token for role', e);
              }
            }
            
            // Redirect based on role
            if (userRole === 'ADMIN') {
              navigate('/dashboard/admin');
            } else if (userRole === 'STAFF') {
              navigate('/staff/dashboard');
            } else {
              navigate('/mainpage/HomePage');
            }
        } catch (error) {
            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau';
            if (error.message) errorMessage = error.message;
            await Swal.fire({ icon: 'error', title: 'Đăng nhập thất bại', text: errorMessage });
        } finally {
            setloading(false);
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
            {/* Top-left brand button to go HomePage */}
            <div className="fixed top-0 left-0 z-50 px-6 py-4">
                <button 
                    onClick={() => navigate('/mainpage/HomePage')} 
                    className="text-2xl font-bold text-[#0028b8] hover:text-[#001a8b] transition-colors cursor-pointer bg-white/80 backdrop-blur-sm px-3 py-1 rounded"
                >
                    EV Battery Swapper
                </button>
            </div>

            <form
                onSubmit={handleLogin}
                className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
            >
                <h2 className="text-3xl font-bold text-center mb-6 text-[#0028b8]">Đăng nhập</h2>

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
                        placeholder="Nhập email"
                    />
                </div>

                {/* Password */}
                <div className="mb-2">
                    <label htmlFor="password" className="block text-gray-700">Mật khẩu</label>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full pr-12 px-3 py-2 border border-[#0028b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0028b8]"
                            placeholder="Nhập mật khẩu"
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
                </div>

                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0028b8] hover:bg-[#0028b8] text-white font-bold py-2 px-4 rounded-md transition-colors mb-3 disabled:opacity-60"
                >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                
                <button
                    type="button"
                    className="w-full border border-[#0028b8] text-[#0028b8] font-bold py-2 px-4 rounded-md hover:bg-[#e0f7f1] transition-colors"
                    onClick={() => {
                        window.location.href = '/register';
                    }}
                >
                    Đăng ký tài khoản mới
                </button>
            </form>
        </div>
    );
}

export default Login
