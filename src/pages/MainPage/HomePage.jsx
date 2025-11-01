import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  let displayName = null;
if (user) {
  displayName = user.lastName?.trim() || null;
}

  const demoCars = [
    {
      id: 1,
      name: "VinFast VF e34",
      range: "285 km",
      battery: "42 kWh",
      image:
        "https://tse1.mm.bing.net/th/id/OIP.riszdhdMzFup8hCkWcLhxwHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      id: 2,
      name: "Tesla Model 3",
      range: "491 km",
      battery: "57.5 kWh",
      image:
        "https://tse2.mm.bing.net/th/id/OIP.aS2_N7oIhYYI5R6IiQ2TbAFrCr?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      id: 3,
      name: "Hyundai Kona Electric",
      range: "305 km",
      battery: "39.2 kWh",
      image:
        "https://tse3.mm.bing.net/th/id/OIP.KIInOUjtxzsg-rBBV2oIAAHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-[#0a1a2f] via-[#0d2e50] to-[#133b62] text-white py-20 px-6 text-center mt-[72px]">
        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {user
              ? `Xin chào, ${displayName} 👋`
              : "EV Battery Swapper – Dịch vụ đổi pin chuyên nghiệp"}
          </h1>
          <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-4 max-w-2xl mx-auto">
            {user
              ? "Chào mừng bạn quay lại hệ thống EV Battery Swapper."
              : "Giải pháp nhanh chóng – an toàn – tiện lợi cho xe điện của bạn."}
          </p>
        </div>
        <div className="absolute inset-0 bg-black opacity-20 pointer-events-none"></div>
      </section>

      {/* Supported Cars */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0d2e50] mb-3 uppercase tracking-wide">
            Các mẫu xe hỗ trợ đổi pin
          </h2>
          <p className="text-gray-600 text-base mb-10 max-w-2xl mx-auto leading-relaxed">
            Danh sách những mẫu xe điện phổ biến có thể sử dụng dịch vụ đổi pin của chúng tôi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {demoCars.map((car) => (
            <div
              key={car.id}
              className="bg-[#f8f9fa] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-2"
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-[#0a1a2f] mb-2">
                  {car.name}
                </h3>
                <p className="text-sm text-gray-600">Quãng đường: {car.range}</p>
                <p className="text-sm text-gray-600">Pin: {car.battery}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
