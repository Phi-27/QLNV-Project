import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../css/styles.css';

// Định nghĩa kiểu cho AccessLogDTO
interface AccessLog {
  logId: number;
  employeeId: number | null;
  fullName: string;
  employeeCode: string;
  accessPointId: number | null;
  accessPointName: string;
  accessTime: string | null; // DateTime từ API
  accessResult: string;
  accessStatus: string;
  accessType: string;
  note: string;
}

const AccessHistoryPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState({ name: 'Tên admin', email: 'mail admin' });
  const [accessPoints, setAccessPoints] = useState<string[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    accessPoint: '',
    employee: '',
    fromDate: '',
    toDate: '',
    result: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const isAuthenticated = await fetchUserInfo();
        if (isAuthenticated) {
          await fetchFilterOptions();
          await fetchAccessLogs(1);
        }
      } catch (err) {
        setError('Lỗi khi khởi tạo: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchUserInfo = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/Auth/user', {
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Không thể xác thực: ' + response.status);
      const user = await response.json();
      if (user.role?.toString().trim() !== 'admin') {
        alert('Bạn không có quyền truy cập trang này.');
        navigate('/staff');
        return false;
      }
      setUserInfo({ name: user.name || 'Tên admin', email: user.email || 'mail admin' });
      return true;
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Lỗi xác thực: ' + (error instanceof Error ? error.message : 'Unknown error'));
      navigate('/login');
      return false;
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/AccessLog/FilterOptions', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Không thể lấy tùy chọn bộ lọc: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('API response for filter options:', data);
      setAccessPoints(data.AccessPoints || []);
      setEmployees(data.Employees || []);
      setResults(data.Results || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setError('Lỗi khi tải bộ lọc: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchAccessLogs = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value.toString());
        }
        });

      const url = `/api/AccessLog?${params}`;
      console.log('Fetching access logs from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Lỗi từ server: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!data.data || !Array.isArray(data.data)) {
        console.log('Invalid data structure:', data);
        setAccessLogs([]);
        setTotalCount(0);
        setError('Không có dữ liệu hợp lệ từ API.');
        return;
      }

      const logs = data.data.map((item: any) => ({
        logId: item.logId,
        employeeId: item.employeeId,
        fullName: item.fullName || 'N/A',
        employeeCode: item.employeeCode || 'N/A',
        accessPointId: item.accessPointId,
        accessPointName: item.accessPointName || 'N/A',
        accessTime: item.accessTime,
        accessResult: item.accessResult || 'N/A',
        accessStatus: item.accessStatus || 'N/A',
        accessType: item.accessType || 'N/A',
        note: item.note || 'N/A',
      }));
      setAccessLogs(logs);
      setCurrentPage(data.page);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      setError('Không thể tải dữ liệu: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setAccessLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    console.log(`Changing ${id} to:`, value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [id]: value,
    }));
    console.log('Updated filters:', { ...filters, [id]: value });
  };

  const handleSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Search button clicked with values:', filters);
    fetchAccessLogs(1);
  };

  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Refresh button clicked');
    setFilters({ accessPoint: '', employee: '', fromDate: '', toDate: '', result: '' });
    fetchAccessLogs(1);
  };

  const logout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  const renderAccessLogs = () => {
    if (loading) return <tr><td colSpan={5} className="py-2 text-center">Đang tải...</td></tr>;
    if (error) return <tr><td colSpan={5} className="py-2 text-center text-red-600">{error}</td></tr>;
    if (!accessLogs.length) return <tr><td colSpan={5} className="py-2 text-center">Không có dữ liệu.</td></tr>;

    return accessLogs.map((log) => {
      const resultText = log.accessResult.trim() || 'N/A';
      const resultColor = resultText.toLowerCase() === 'thành công' ? 'text-green-500' : resultText.toLowerCase() === 'thất bại' ? 'text-red-500' : 'text-yellow-500';
      return (
        <tr key={log.logId} className="border-t border-gray-500">
          <td className="py-2">{log.fullName}</td>
          <td className="py-2">{log.employeeCode}</td>
          <td className="py-2">{log.accessPointName}</td>
          <td className="py-2">{log.accessTime ? new Date(log.accessTime).toLocaleString('vi-VN') : 'N/A'}</td>
          <td className={`py-2 px-2 flex items-center ${resultColor}`}>
            {resultText.toLowerCase() === 'thành công' && <i data-lucide="check-circle" className="w-4 h-4 mr-1"></i>}
            {resultText.toLowerCase() === 'thất bại' && <i data-lucide="x-circle" className="w-4 h-4 mr-1"></i>}
            {(resultText.toLowerCase() !== 'thành công' && resultText.toLowerCase() !== 'thất bại') && <i data-lucide="clock" className="w-4 h-4 mr-1"></i>}
            <span className="align-middle">{resultText}</span>
          </td>
        </tr>
      );
    });
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    return (
      <div className="flex justify-center items-center gap-2 mt-4 text-sm">
        <button
          className="text-gray-600 hover:text-black"
          disabled={currentPage <= 1}
          onClick={() => fetchAccessLogs(currentPage - 1)}
        >
          « Trước
        </button>
        {pages.map((page) => (
          <button
            key={page}
            className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            onClick={() => fetchAccessLogs(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="text-gray-600 hover:text-black"
          disabled={currentPage >= totalPages}
          onClick={() => fetchAccessLogs(currentPage + 1)}
        >
          Sau »
        </button>
      </div>
    );
  };

  return (
    <div className="flex bg-gray-100 font-sans min-h-screen">
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow header">
          <div className="flex items-center justify-between px-6 py-4">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-1/2 px-4 py-2 border rounded-full shadow-sm"
              id="global-search"
            />
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-3">
                <img src="/images/images.jpeg" alt="Ảnh admin" className="w-12 h-12 rounded-full object-cover" />
                <div className="text-sm">
                  <div className="font-semibold" id="user-name">{userInfo.name}</div>
                  <div className="text-gray-500 text-xs" id="user-email">{userInfo.email}</div>
                </div>
              </div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                <a href="/admin" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm font-medium text-blue-600">Xem hồ sơ</a>
                <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đổi mật khẩu</a>
                <a href="#" onClick={logout} className="block px-4 py-2 hover:bg-gray-100 text-sm text-center">Đăng xuất</a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex mt-6">
          <Sidebar />
          <div className="flex-1 gap-4 ml-4">
            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <i data-lucide="filter" className="w-5 h-5 text-gray-600"></i> Bộ lọc
              </h2>
              <div className="grid grid-cols-6 gap-4 mb-4 items-end">
                <div className="col-span-1">
                  <label htmlFor="access-point" className="block text-sm text-gray-700 mb-1">Access Point</label>
                  <input
                    id="accessPoint"
                    type="text"
                    placeholder="VD: Tầng 1-Cổng 1"
                    className="border p-2 rounded w-full"
                    value={filters.accessPoint}
                    onChange={handleFilterChange}
                    list="access-points"
                  />
                  <datalist id="access-points">
                    {accessPoints.map((ap) => <option key={ap} value={ap} />)}
                  </datalist>
                </div>
                <div className="col-span-1">
                  <label htmlFor="employee" className="block text-sm text-gray-700 mb-1">Nhân viên</label>
                  <input
                    id="employee"
                    type="text"
                    list="employees"
                    placeholder="VD: Nguyễn Văn A"
                    className="border p-2 rounded w-full"
                    value={filters.employee}
                    onChange={handleFilterChange}
                  />
                  <datalist id="employees">
                    {employees.map((emp) => <option key={emp} value={emp} />)}
                  </datalist>
                </div>
                <div className="col-span-1">
                  <label htmlFor="from-date" className="block text-sm text-gray-700 mb-1">Từ ngày</label>
                  <input
                    id="fromDate"
                    type="date"
                    className="border p-2 rounded w-full"
                    value={filters.fromDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="to-date" className="block text-sm text-gray-700 mb-1">Đến ngày</label>
                  <input
                    id="toDate"
                    type="date"
                    className="border p-2 rounded w-full"
                    value={filters.toDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-span-1">
                  <label htmlFor="result" className="block text-sm text-gray-700 mb-1">Kết quả</label>
                  <input
                    id="result"
                    type="text"
                    list="results"
                    placeholder="VD: Thành công"
                    className="border p-2 rounded w-full"
                    value={filters.result}
                    onChange={handleFilterChange}
                  />
                  <datalist id="results">
                    {results.map((res) => <option key={res} value={res} />)}
                  </datalist>
                </div>
                <div className="col-span-1">
                  <button
                    id="btn-search"
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full flex items-center justify-center space-x-1"
                    onClick={handleSearch}
                  >
                    <i data-lucide="search" className="w-4 h-4"></i>
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 text-white rounded p-4 shadow overflow-x-auto">
              <div className="flex items-center mb-4">
                <div className="w-2 h-5 bg-blue-500 rounded-sm mr-2"></div>
                <h2 className="text-lg font-semibold">Lịch sử truy cập</h2>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="border-b border-gray-400">
                  <tr>
                    <th className="py-2">Nhân viên</th>
                    <th>Mã NV</th>
                    <th>Access Point</th>
                    <th>Thời gian</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody id="history-table-body">{renderAccessLogs()}</tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                id="btn-refresh"
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-1"
                onClick={handleRefresh}
              >
                <i data-lucide="refresh-ccw" className="w-4 h-4"></i>
                <span>Làm mới</span>
              </button>
            </div>

            {renderPagination()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccessHistoryPage;