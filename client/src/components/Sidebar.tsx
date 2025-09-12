import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white rounded shadow sidebar">
      <nav className="px-4 py-2 space-y-2">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center space-x-2 text-gray-700 hover:text-blue-600 ${isActive ? 'text-white bg-blue-600 py-2 rounded' : ''}`
          }
        >
          <span>Trang chủ</span>
        </NavLink>
        <NavLink
          to="/staff"
          className={({ isActive }) =>
            `flex items-center space-x-2 text-gray-700 hover:text-blue-600 ${isActive ? 'text-white bg-blue-600 py-2 rounded' : ''}`
          }
        >
          <span>Nhân viên</span>
        </NavLink>
        <NavLink
          to="/building"
          className={({ isActive }) =>
            `flex items-center space-x-2 text-gray-700 hover:text-blue-600 ${isActive ? 'text-white bg-blue-600 py-2 rounded' : ''}`
          }
        >
          <span>Toà nhà</span>
        </NavLink>
        <NavLink
          to="/access-point"
          className={({ isActive }) =>
            `flex items-center space-x-2 text-gray-700 hover:text-blue-600 ${isActive ? 'text-white bg-blue-600 py-2 rounded' : ''}`
          }
        >
          <span>Access Point</span>
        </NavLink>
        <NavLink
          to="/access-history"
          className={({ isActive }) =>
            `flex items-center space-x-2 text-gray-700 hover:text-blue-600 ${isActive ? 'text-white bg-blue-600 py-2 rounded' : ''}`
          }
        >
          <span>Lịch sử truy cập</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;