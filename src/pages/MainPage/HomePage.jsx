import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  let displayName = null;
if (user) {
  displayName = user.lastName?.trim() || null;
}

  const demoCars = [
    {
      id: 1,
      name: "VinFast Herio",
      model: "SUV",
      seats: "5 chỗ",
      range: "326 km",
      battery: "40.5 kWh",
      image:
        "https://vinfastauto.com/themes/porto/img/homepage-v2/car/HerioGreen.webp",
    },
    {
      id: 2,
      name: "VinFast VF6",
      model: "Sedan",
      seats: "5 chỗ",
      range: "480 km", 
      battery: "59.6 kWh",
      image:
        "https://vinfastauto.com/themes/porto/img/homepage-v2/car/VF6.webp",
    },
    {
      id: 3,
      name: "VinFast VF7",
      model: "MiniCar", 
      seats: "4 chỗ",
      range: "496 km",
      battery: "75.3 kWh",
      image:
        "https://vinfastauto.com/themes/porto/img/homepage-v2/car/VF7.webp",
    },
    
    {
      id: 4,
      name: "VinFast VF8",
      model: "SUV",
      seats: "5 chỗ",
      range: "420 km",
      battery: "82 kWh",
      image:
        "https://vinfastauto.com/themes/porto/img/homepage-v2/car/VF8.webp",
    },{
      id: 5,
      name: "VinFast VF9",
      model: "SUV",
      seats: "5 chỗ",
      range: "423 km",
      battery: "92 kWh",
      image:
        "https://vinfastauto.com/themes/porto/img/homepage-v2/car/VF9.webp",
    },
  ];

  const nextCar = () => {
    setImageLoading(true);
    setTimeout(() => {
      setCurrentCarIndex((prev) => (prev + 1) % demoCars.length);
      setImageLoading(false);
    }, 150);
  };

  const prevCar = () => {
    setImageLoading(true);
    setTimeout(() => {
      setCurrentCarIndex((prev) => (prev - 1 + demoCars.length) % demoCars.length);
      setImageLoading(false);
    }, 150);
  };

  const goToCar = (index) => {
    if (index !== currentCarIndex) {
      setImageLoading(true);
      setTimeout(() => {
        setCurrentCarIndex(index);
        setImageLoading(false);
      }, 150);
    }
  };

  const currentCar = demoCars[currentCarIndex];

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
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center px-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0d2e50] mb-3 uppercase tracking-wide">
            Các mẫu xe hỗ trợ đổi pin
          </h2>
          <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
            Danh sách những mẫu xe điện phổ biến có thể sử dụng dịch vụ đổi pin của chúng tôi.
          </p>
        </div>

        {/* Full Width Car Display */}
        <div className="w-full">
          <div className="relative bg-white overflow-hidden">
            {/* Car Image Section - Full Width */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-[560px]">
              {/* Navigation Arrows */}
              <button
                onClick={prevCar}
                className="absolute left-8 top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-gray-50 rounded-full p-4 shadow-xl transition-all duration-200 cursor-pointer"
                aria-label="Xe trước"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={nextCar}
                className="absolute right-8 top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-gray-50 rounded-full p-4 shadow-xl transition-all duration-200 cursor-pointer"
                aria-label="Xe tiếp theo"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Brand Logo Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="text-9xl font-bold text-gray-400 tracking-wider">VF5</div>
              </div>

              {/* Car Image - Full Container */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`transition-all duration-500 ease-in-out w-full h-full flex items-center justify-center ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  <img
                    src={currentCar.image}
                    alt={currentCar.name}
                    className="w-full h-full object-contain"
                    onLoad={() => setImageLoading(false)}
                  />
                </div>
              </div>
            </div>

            {/* Car Info Section - Compact */}
            <div className="bg-white py-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className={`transition-all duration-500 ease-in-out delay-150 ${imageLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  {/* Car Title */}
                  <div className="text-center mb-6">
                    <h3 className="text-4xl font-bold text-gray-800">
                      {currentCar.name}
                    </h3>
                  </div>
                  
                  {/* Car Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center max-w-xl mx-auto">
                    <div className="text-center">
                      <div className="text-gray-500 text-base mb-2">Lượng pin</div>
                      <div className="font-bold text-2xl text-gray-800">{currentCar.battery}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-base mb-2">Quãng đường đi được</div>
                      <div className="font-bold text-2xl text-gray-800">{currentCar.range}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center space-x-3 mt-8">
                {demoCars.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToCar(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentCarIndex
                        ? 'bg-[#0028b8] scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Chuyển đến xe ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
