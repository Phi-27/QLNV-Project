import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface AccessLog {
  employeeName: string;
  accessPointName: string;
  accessTime: string;
  accessResult: string;
  accessStatus: string;
}

interface Statistics {
  employeeCount: number;
  siteCount: number;
  accessPointCount: number;
  accessTodayCount: number;
  successfulAccessCount: number;
  failedAccessCount: number;
  recentAccessLogs: {
    data: AccessLog[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

const AdminPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchUserInfo();
      await fetchStatistics(1);
    };
    init();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/Auth/user', { credentials: 'include' });
      if (!response.ok) {
        navigate('/login');
        return;
      }
      const user: UserInfo = await response.json();
      const role = user.role?.trim();
      if (role !== 'admin') {
        navigate('/employee');
        return;
      }
      setUserInfo(user);
    } catch (err) {
      console.error('Error fetching user info:', err);
      navigate('/login');
    }
  };

  const fetchStatistics = async (page: number) => {
    try {
      const response = await fetch(`/api/Home/statistics?page=${page}&pageSize=${pageSize}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Statistics = await response.json();
      setStatistics(data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Không thể tải dữ liệu thống kê.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      navigate('/login');
    }
  };

  const totalPages = statistics ? Math.ceil(statistics.recentAccessLogs.totalCount / pageSize) : 1;

  return (
    <div className="flex bg-gray-100 font-sans">
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow header">
          <div className="flex items-center justify-between px-6 py-4">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <input
              type="text"
              placeholder="🔍 Tìm kiếm..."
              className="w-1/2 px-4 py-2 border rounded-full shadow-sm"
            />
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-3">
                <img src="/images/images.jpeg" alt="Ảnh admin" className="w-12 h-12 rounded-full object-cover" />
                <div className="text-sm">
                  <div className="font-semibold">{userInfo?.name || 'Tên admin'}</div>
                  <div className="text-gray-500 text-xs">{userInfo?.email || 'mail admin'}</div>
                </div>
              </div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                <a href="/admin/profile" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">
                  Xem hồ sơ
                </a>
                <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">
                  Đổi mật khẩu
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex mt-6">
          <Sidebar />
          <div className="flex-1 gap-4 ml-4">
            <div className="w-full text-center mb-6">
              <h2 className="text-2xl font-semibold">👋 Xin chào, Admin!</h2>
              <p className="text-gray-600">Chúc bạn một ngày làm việc hiệu quả.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-blue-600">{statistics?.employeeCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Nhân viên</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-green-600">{statistics?.siteCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Toà nhà</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-yellow-600">{statistics?.accessPointCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Access Point</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-red-600">{statistics?.accessTodayCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Lượt truy cập hôm nay</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-green-500">{statistics?.successfulAccessCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Truy cập thành công</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <div className="text-xl font-bold text-red-500">{statistics?.failedAccessCount ?? 0}</div>
                <div className="text-gray-600 mt-2">Thất bại</div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Lịch sử truy cập hôm nay</h3>
              <div className="bg-white p-6 rounded-xl shadow">
                {error && <p className="text-red-600 text-center">{error}</p>}
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">Nhân viên</th>
                      <th className="py-2">Điểm truy cập</th>
                      <th className="py-2">Thời gian</th>
                      <th className="py-2">Kết quả</th>
                      <th className="py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics?.recentAccessLogs?.data?.length ? (
                      statistics.recentAccessLogs.data.map((log, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{log.employeeName}</td>
                          <td className="py-2">{log.accessPointName}</td>
                          <td className="py-2">{log.accessTime}</td>
                          <td
                            className={`py-2 ${
                              log.accessResult.toLowerCase().trim() === 'thành công'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {log.accessResult}
                          </td>
                          <td className="py-2">{log.accessStatus}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-2 text-center">
                          Không có dữ liệu truy cập hôm nay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-center items-center gap-2 mt-4 text-sm">
                  <button
                    className="text-gray-600 hover:text-black"
                    disabled={currentPage <= 1}
                    onClick={() => fetchStatistics(currentPage - 1)}
                  >
                    « Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`px-3 py-1 rounded ${
                        page === currentPage ? 'bg-blue-600 text-white' : 'bg-white border'
                      }`}
                      onClick={() => fetchStatistics(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="text-gray-600 hover:text-black"
                    disabled={currentPage >= totalPages}
                    onClick={() => fetchStatistics(currentPage + 1)}
                  >
                    Sau »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;