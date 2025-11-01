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

function App() {
  return (
    <Router>
      <Routes>
        {/* Main pages */}
        <Route path="/mainpage" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/admin" element={<Admin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/batteries" element={<BatteryManagement />} />
        <Route path="/staff/battery-monitoring" element={<BatteryMonitoring />} />
        <Route path="/staff/transactions" element={<TransactionManagement />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/stations/:id" element={<PublicStationDetail />} />
        <Route path="/dashboard/admin/station/:id" element={<StationDetail />} />
        <Route path="/dashboard/admin/staff" element={<StaffManagement />} />
        <Route path="/staff/manage-staff" element={<StaffManagementForStaff />} />

        {/* Profile routes */}
        <Route path="/profile" element={<ProfileUser />} />
        <Route path="/profile/edit" element={<EditProfile />} />

        {/* Driver routes */}
        <Route path="/driver/orders" element={<MyOrders />} />
        <Route path="/driver/my-orders" element={<MyOrders />} />

        {/* Payment routes */}
        <Route path="/payment/return" element={<PaymentReturn />} />

        {/* Fallback route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
