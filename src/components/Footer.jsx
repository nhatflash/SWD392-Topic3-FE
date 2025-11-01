import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0028b8] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">EV Battery Swapper</h3>
            <p className="text-blue-100 mb-4 leading-relaxed">
              Giải pháp thay pin xe điện nhanh chóng, tiện lợi và thân thiện với môi trường. 
              Mạng lưới trạm đổi pin hàng đầu Việt Nam.
            </p>
            <div className="flex space-x-4">
              {/* Battery Icon */}
              <div className="text-green-400 hover:text-green-300 transition-colors" title="Pin sạch">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2m16 0v8a1 1 0 01-1 1H5a1 1 0 01-1-1V7m16 0H4m7 4h2m-2 4h2"/>
                </svg>
              </div>
              
              {/* Electric Car Icon */}
              <div className="text-blue-300 hover:text-white transition-colors" title="Xe điện">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              
              {/* Fast Charging Icon */}
              <div className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Sạc nhanh">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              
              {/* Green Leaf Icon */}
              <div className="text-green-300 hover:text-green-200 transition-colors" title="Thân thiện môi trường">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.59c.48-.17 1.02-.26 1.58-.26C14 19.15 18 15.15 18 8.5c0-4.08-2.05-6.85-5-8.5C8.5 1.85 4 6.68 4 8.5c0 2.06.77 3.17 1.5 4.5C7.5 10.5 10.5 8.5 17 8z"/>
                </svg>
              </div>
              
              {/* Location/Station Icon */}
              <div className="text-red-300 hover:text-red-200 transition-colors" title="Mạng lưới trạm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/mainpage" className="text-blue-100 hover:text-white transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/stations" className="text-blue-100 hover:text-white transition-colors">
                  Trạm đổi pin
                </Link>
              </li>
              <li>
                <Link to="/driver/my-orders" className="text-blue-100 hover:text-white transition-colors">
                  Đơn hàng của tôi
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-blue-100 hover:text-white transition-colors">
                  Tài khoản
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-blue-100 hover:text-white transition-colors">
                  Đăng nhập
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/stations" className="text-blue-100 hover:text-white transition-colors">
                  Tìm trạm đổi pin
                </Link>
              </li>
              <li>
                <Link to="/driver/my-orders" className="text-blue-100 hover:text-white transition-colors">
                  Theo dõi đơn hàng
                </Link>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Thanh toán VNPay
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Hỗ trợ 24/7
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Đánh giá dịch vụ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-200 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <div>
                  <p className="text-blue-100">
                    Nhà Văn hóa Sinh viên TP.HCM<br />
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span className="text-blue-100">1900 1234</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span className="text-blue-100">support@evbatteryswapper.com</span>
              </div>

              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-blue-100">24/7 - Hoạt động liên tục</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-600 mt-8 pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-blue-100 text-sm">
              © 2025 EV Battery Swapper. Tất cả quyền được bảo lưu.
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                Câu hỏi thường gặp
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                Hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;