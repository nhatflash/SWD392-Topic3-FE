import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from './pages/Register/Register';
import Login from "./pages/Login/Login";
import Admin from "./pages/DashBoard/Admin";
import HomePage from "./pages/DashBoard/HomePage";
function App() {

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} /> {/* mặc định vào login */}
        <Route path="/dashboard/admin" element={<Admin />} />
        <Route path="/dashboard/HomePage" element={<HomePage />}/> {/*Trang chính của tất cả mọi người */}
      </Routes>
    </Router>
  );
}

export default App
