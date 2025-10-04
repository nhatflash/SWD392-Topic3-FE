import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Battery,
  FileBarChart,
  LogOut,
  Menu,
} from "lucide-react"; // icon đẹp (npm install lucide-react)

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-[#00b894] text-white p-4 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold transition-all ${
              isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            EV Swapper
          </h2>
          <button onClick={toggleSidebar} className="text-white">
            <Menu />
          </button>
        </div>

        <nav>
          <ul className="space-y-3">
            <li>
              <a
                href="/admin/dashboard"
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d]"
              >
                <LayoutDashboard /> {isSidebarOpen && "Dashboard"}
              </a>
            </li>
            <li>
              <a
                href="/admin/users"
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d]"
              >
                <Users /> {isSidebarOpen && "Quản lý Users"}
              </a>
            </li>
            <li>
              <a
                href="/admin/stations"
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d]"
              >
                <Battery /> {isSidebarOpen && "Trạm sạc/đổi pin"}
              </a>
            </li>
            <li>
              <a
                href="/admin/reports"
                className="flex items-center gap-3 p-2 rounded hover:bg-[#009e7d]"
              >
                <FileBarChart /> {isSidebarOpen && "Báo cáo"}
              </a>
            </li>
            <li>
              <button className="flex items-center gap-3 p-2 rounded hover:bg-red-500 w-full">
                <LogOut /> {isSidebarOpen && "Đăng xuất"}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">
          Trang Quản Trị EV Battery Swapper 🚀
        </h1>

        {/* Cards section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold">Tổng số User</h3>
            <p className="text-3xl font-bold text-[#00b894]">1,245</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold">Trạm hoạt động</h3>
            <p className="text-3xl font-bold text-[#00b894]">32</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold">Giao dịch hôm nay</h3>
            <p className="text-3xl font-bold text-[#00b894]">412</p>
          </div>
        </div>

        {/* Table example */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Danh sách trạm gần đây</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3">Tên trạm</th>
                <th className="p-3">Địa chỉ</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">Trạm EV01</td>
                <td className="p-3">Hà Nội</td>
                <td className="p-3 text-green-600 font-semibold">Hoạt động</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Trạm EV02</td>
                <td className="p-3">TP.HCM</td>
                <td className="p-3 text-yellow-600 font-semibold">Bảo trì</td>
              </tr>
              <tr className="border-t">
                <td className="p-3">Trạm EV03</td>
                <td className="p-3">Đà Nẵng</td>
                <td className="p-3 text-green-600 font-semibold">Hoạt động</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Admin;
