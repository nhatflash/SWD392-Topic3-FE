import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold text-[#00b894] mb-4">
        Xin chào, {user?.username || "Người dùng"} 👋
      </h1>
      <p className="text-gray-700 mb-8">Chào mừng đến với hệ thống EV Battery Swapper</p>

      {/* Các chức năng chung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <button
          onClick={() => navigate("/profile")}
          className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
        >
          <h2 className="text-xl font-semibold text-[#00b894]">Thông tin cá nhân</h2>
          <p className="text-gray-600 mt-2">Xem và chỉnh sửa thông tin tài khoản</p>
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
        >
          <h2 className="text-xl font-semibold text-[#00b894]">Thông báo</h2>
          <p className="text-gray-600 mt-2">Xem thông báo mới nhất từ hệ thống</p>
        </button>

        {/* Nếu là ADMIN */}
        {user?.role === "ADMIN" && (
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-semibold text-[#00b894]">Quản lý hệ thống</h2>
            <p className="text-gray-600 mt-2">Truy cập bảng điều khiển dành cho Admin</p>
          </button>
        )}

        {/* Nếu là CUSTOMER */}
        {user?.role === "CUSTOMER" && (
          <button
            onClick={() => navigate("/customer/home")}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-semibold text-[#00b894]">Đặt lịch đổi pin</h2>
            <p className="text-gray-600 mt-2">Đặt và theo dõi lịch đổi pin của bạn</p>
          </button>
        )}

        {/* Nếu là STATION_STAFF */}
        {user?.role === "STATION_STAFF" && (
          <button
            onClick={() => navigate("/staff/schedule")}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-semibold text-[#00b894]">Quản lý lịch làm việc</h2>
            <p className="text-gray-600 mt-2">Xem và quản lý ca trực của bạn</p>
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;
