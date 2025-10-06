import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  let displayName = null;
  if (user) {
    const given = user.firstName || user.username || user.email || '';
    const family = user.lastName ? ` ${user.lastName}` : '';
    displayName = (given + family).trim() || null;
  }

  const demoCars = [
    { id: 1, name: "VinFast VF e34", range: "285 km", battery: "42 kWh", image: "https://tse1.mm.bing.net/th/id/OIP.riszdhdMzFup8hCkWcLhxwHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: 2, name: "Tesla Model 3", range: "491 km", battery: "57.5 kWh", image: "https://tse2.mm.bing.net/th/id/OIP.aS2_N7oIhYYI5R6IiQ2TbAFrCr?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: 3, name: "Hyundai Kona Electric", range: "305 km", battery: "39.2 kWh", image: "https://tse3.mm.bing.net/th/id/OIP.KIInOUjtxzsg-rBBV2oIAAHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" },
  ];

  return (
    <div className="min-h-screen bg-[#0028b8] flex flex-col items-center justify-center p-8">
      <Header />

      <div className="w-full max-w-4xl flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {user ? `Xin chào, ${displayName} 👋` : "Chào mừng bạn đến với EV Battery Swapper"}
        </h1>
        <p className="text-white mb-6">
          {user
            ? "Chào mừng đến với hệ thống EV Battery Swapper"
            : "Bạn có thể xem các mẫu xe hỗ trợ đổi pin dưới đây hoặc đăng nhập để trải nghiệm đầy đủ"}
        </p>

        {!user && (
          <button
            onClick={() => navigate("/login")}
            className="mb-8 px-6 py-3 bg-white text-[#0028b8] font-bold rounded-lg shadow hover:bg-gray-100 transition"
          >
            Đăng nhập ngay
          </button>
        )}
      </div>

      {/* Demo cars */}
      <div className="w-full max-w-5xl mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Các mẫu xe hỗ trợ đổi pin</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoCars.map((car) => (
            <div key={car.id} className="bg-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col items-center">
              <img src={car.image} alt={car.name} className="w-full h-40 object-cover rounded-lg mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">{car.name}</h3>
              <p className="text-gray-600">Quãng đường: {car.range}</p>
              <p className="text-gray-600">Pin: {car.battery}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard buttons */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <button
            onClick={() => navigate("/profile")}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-semibold text-[#0028b8]">Thông tin cá nhân</h2>
            <p className="text-gray-600 mt-2">Xem và chỉnh sửa thông tin tài khoản</p>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
          >
            <h2 className="text-xl font-semibold text-[#0028b8]">Thông báo</h2>
            <p className="text-gray-600 mt-2">Xem thông báo mới nhất từ hệ thống</p>
          </button>

          {hasRole("ADMIN") && (
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
            >
              <h2 className="text-xl font-semibold text-[#0028b8]">Quản lý hệ thống</h2>
              <p className="text-gray-600 mt-2">Truy cập bảng điều khiển dành cho Admin</p>
            </button>
          )}

          {hasRole("CUSTOMER") && (
            <button
              onClick={() => navigate("/customer/home")}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
            >
              <h2 className="text-xl font-semibold text-[#0028b8]">Đặt lịch đổi pin</h2>
              <p className="text-gray-600 mt-2">Đặt và theo dõi lịch đổi pin của bạn</p>
            </button>
          )}

          {hasRole("STATION_STAFF") && (
            <button
              onClick={() => navigate("/staff/schedule")}
              className="bg-white shadow-lg rounded-xl p-6 hover:shadow-2xl transition"
            >
              <h2 className="text-xl font-semibold text-[#0028b8]">Quản lý lịch làm việc</h2>
              <p className="text-gray-600 mt-2">Xem và quản lý ca trực của bạn</p>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
