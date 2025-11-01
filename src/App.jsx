import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from './pages/Register/Register';
import Login from "./pages/Login/Login";
import Admin from "./pages/DashBoard/Admin";
import HomePage from "./pages/MainPage/HomePage";
import ProfileUser from './pages/Profile/pages/ProfileUser';
import EditProfile from './pages/Profile/pages/EditProfile';
import StaffDashboard from './pages/Staff/StaffDashboard';
import Stations from './pages/Stations/Stations';
import StationDetail from './pages/Stations/StationDetail';
import PublicStationDetail from './pages/Stations/PublicStationDetail';
import StaffManagement from './pages/DashBoard/Staff/StaffManagement';
import StaffManagementForStaff from './pages/Staff/StaffManagement/StaffManagement';
import BatteryManagement from './pages/Staff/BatteryManagement/BatteryManagement';
import BatteryMonitoring from './pages/Staff/BatteryMonitoring/BatteryMonitoring';
import TransactionManagement from './pages/Staff/TransactionManagement/TransactionManagement';
import MyOrders from './pages/Driver/MyOrders/MyOrders';
import PaymentReturn from './pages/Payment/PaymentReturn/PaymentReturn';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages with Layout (Header + Footer) */}
        <Route path="/mainpage" element={<Layout><HomePage /></Layout>} />
        <Route path="/stations" element={<Layout><Stations /></Layout>} />
        <Route path="/stations/:id" element={<Layout><PublicStationDetail /></Layout>} />
        
        {/* Auth pages - no header/footer */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin/Staff pages - no footer (keep existing header if any) */}
        <Route path="/dashboard/admin" element={<Admin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/batteries" element={<BatteryManagement />} />
        <Route path="/staff/battery-monitoring" element={<BatteryMonitoring />} />
        <Route path="/staff/transactions" element={<TransactionManagement />} />
        <Route path="/dashboard/admin/station/:id" element={<StationDetail />} />
        <Route path="/dashboard/admin/staff" element={<StaffManagement />} />
        <Route path="/staff/manage-staff" element={<StaffManagementForStaff />} />

        {/* User pages with Layout */}
        <Route path="/profile" element={<Layout><ProfileUser /></Layout>} />
        <Route path="/profile/edit" element={<Layout><EditProfile /></Layout>} />

        {/* Driver pages with Layout */}
        <Route path="/driver/orders" element={<Layout><MyOrders /></Layout>} />
        <Route path="/driver/my-orders" element={<Layout><MyOrders /></Layout>} />

        {/* Payment pages - minimal layout */}
        <Route path="/payment/return" element={<Layout showHeader={false}><PaymentReturn /></Layout>} />

        {/* Fallback route */}
        <Route path="*" element={<Layout><HomePage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
