import React, { useState} from "react";
import Swal from "sweetalert2";

const Login = () => {

    const [formData, setFormData] = useState({ emailOrUserName: "" , password: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const validationForm = () => {
        if (!formData.emailOrUserName || !formData.password){
            Swal.fire({
                icon: "error",
                title: "Thiếu thông tin",
                text: "Vui lòng nhập đầy đủ Email/UserName và Password"
            });
            return false;
        }
        return true;
    }

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validationForm()) return;

        try {
            setloading(true);

            // hiện loading
            const loadingAlert = Swal.fire({
                title: "Đang đăng nhập...",
                text: "Vui lòng chờ trong giây lát",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // thử login
            await login ({...formData});
            loadingAlert.close();

            // Thông báo login thành công
            Swal.fire({
                icon: "success",
                title: "Đăng nhập thành công",
                text: "Chào mừng bạn đã đến với hệ thống quản lý trạm sạc",
                showConfirmButton: false,
                timer: 1500
            });

            addNotification("Đăng nhập thành công", "success");
        } catch (error) {
            let errorMessage = "Đăng nhập thất bại. Vui lòng thử lại sau";

            if (error.response ?.status === 401) {
                errorMessage = 'Email/userName hoặc mật khẩu không chính xác';
            }
            else if (error.response?.status === 404){
                errorMessage = 'Không tìm thấy tài khoản với email/userName này';
            }
            else if (error.response?.status === 403) {
                errorMessage = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên';
            }
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            // Hiển thị thông báo lỗi
            await Swal.fire ({
                icon: "error",
                title: "Đăng nhập thất bại",
                text: errorMessage,
                confirmButtonText: "Thử lại",
                confirmButtonColor: "#3085d6",
                allowOutsideClick : false,
                allowEscapeKey : false
            }). then ((result) => {
                if (result.isConfirmed){
                    // Reload lại trang khi người dùng bấm "Thử lại"
                    window.location.reload();
                }
            });
        }
        finally {
            setloading(false);
        }
    };
    return (
        <div
            className="min-h-screen w-full flex items-center justify-center"
            style={{ backgroundColor: '#00b894' }}
        >
            <form
                onSubmit={handleLogin}
                className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
            >
                <h2 className="text-3xl font-bold text-center mb-6 text-[#00b894]">Đăng nhập</h2>

                {/* Email or Username */}
                <div className="mb-4">
                    <label htmlFor="emailOrUserName" className="block text-gray-700">Email hoặc User Name</label>
                    <input
                        id="emailOrUserName"
                        type="text"
                        name="emailOrUserName"
                        value={formData.emailOrUserName}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                        placeholder="Nhập email hoặc user name"
                    />
                </div>

                {/* Password */}
                <div className="mb-2">
                    <label htmlFor="password" className="block text-gray-700">Mật khẩu</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-[#00b894] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                        placeholder="Nhập mật khẩu"
                    />
                </div>

                {/* Forgot password link */}
                <div className="mb-6 text-right">
                    <button
                        type="button"
                        className="text-[#00b894] hover:underline text-sm font-medium"
                        onClick={() => {/* handle forgot password */}}
                    >
                        Quên mật khẩu?
                    </button>
                </div>

                {/* Login button */}
                <button
                    type="submit"
                    className="w-full bg-[#00b894] hover:bg-[#009e7d] text-white font-bold py-2 px-4 rounded-md transition-colors mb-3"
                >
                    Đăng nhập
                </button>

                {/* Register button */}
                <button
                    type="button"
                    className="w-full border border-[#00b894] text-[#00b894] font-bold py-2 px-4 rounded-md hover:bg-[#e0f7f1] transition-colors"
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
