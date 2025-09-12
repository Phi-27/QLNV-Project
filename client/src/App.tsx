import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import StaffPage from './pages/StaffPage';
import StaffDetailPage from './pages/StaffDetailPage';
import LoginPage from './pages/LoginPage';
import BuildingPage from './pages/BuildingPage';
import BuildingDetailPage from './pages/BuildingDetailPage';
import AccessPointPage from './pages/AccessPointPage';
import AccessPointDetail from './pages/AccessPointDetail';
import AccessHistoryPage from './pages/AccessHistoryPage';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/staff-detail" element={<StaffDetailPage />} />
        <Route path="/building" element={<BuildingPage />} />
        <Route path="/building-detail" element={<BuildingDetailPage />} />
        <Route path="/access-point" element={<AccessPointPage />} />
        <Route path="/access-point-detail" element={<AccessPointDetail />} />
        <Route path="/access-history" element={<AccessHistoryPage/>} />
        <Route path="*" element={<LoginPage />} /> 
      </Routes>
    </Router>
  );
};

export default App;