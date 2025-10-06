import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from './pages/Register/Register';
import Login from "./pages/Login/Login";
import Admin from "./pages/DashBoard/Admin";
import HomePage from "./pages/MainPage/HomePage";
import ProfileUser from './pages/Profile/pages/ProfileUser';
import EditProfile from './pages/Profile/pages/EditProfile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main pages */}
        <Route path="/mainpage" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/admin" element={<Admin />} />

        {/* Profile routes */}
        <Route path="/profile" element={<ProfileUser />} />
        <Route path="/profile/edit" element={<EditProfile />} />

        {/* Fallback route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
