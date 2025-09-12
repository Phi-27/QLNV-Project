import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as ExcelJS from 'exceljs';

interface Employee {
  employeeId: number;
  fullName: string;
  department: string;
  phone: string;
  email: string;
  isActive: boolean;
}

interface Stats {
  totalAccess: number;
  avgCheckIn: string;
  avgCheckOut: string;
  employeeRating: string;
}

interface AttendanceLog {
  fullName: string;
  date: string;
  dayOfWeek: string;
  status: string;
  checkIn: string;
  checkOut: string;
  workingTime: string;
}

const StaffDetailPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AttendanceLog; ascending: boolean }>({ key: 'date', ascending: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const employeeId = queryParams.get('id');

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/Auth/user', { credentials: 'include' });
      if (!response.ok) {
        navigate('/login');
        return;
      }
      const user = await response.json();
      const role = user.role?.trim();
      if (role !== 'admin') {
        navigate('/employee');
        return;
      }
      setUserInfo(user);
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchEmployeeDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/Home/${employeeId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Không lấy được thông tin nhân viên');
      const data = await response.json();
      setEmployee(data.employee);
      setStats(data.stats);
    } catch (error) {
      console.error('Lỗi lấy thông tin nhân viên:', error);
      setError('Không thể tải thông tin nhân viên: ' + (error as Error).message);
      setEmployee(null);
    }
  }, [employeeId]);

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/Home/attendance/${employeeId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Không lấy được lịch sử điểm danh');
      const data = await response.json();
      setAttendanceLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error('Lỗi lấy lịch sử điểm danh:', error);
      setError('Không thể tải lịch sử điểm danh: ' + (error as Error).message);
      setAttendanceLogs([]);
      setFilteredLogs([]);
    }
  }, [employeeId]);

  const filterLogs = useCallback(() => {
    if (!attendanceLogs.length) {
      setFilteredLogs([]);
      return;
    }
    let logs = [...attendanceLogs];
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      logs = logs.filter(log => {
        const [day, month, year] = log.date.split('/');
        const logDate = new Date(`${year}-${month}-${day}`);
        return logDate >= startDate && logDate <= endDate;
      });
    }
    setFilteredLogs(logs);
  }, [attendanceLogs, dateRange]);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchUserInfo();
        if (employeeId) {
          await fetchEmployeeDetails();
          await fetchAttendanceHistory();
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc liên hệ admin.');
        console.error('Lỗi khởi tạo:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [employeeId, fetchUserInfo, fetchEmployeeDetails, fetchAttendanceHistory]);

  useEffect(() => {
    filterLogs();
  }, [filterLogs, attendanceLogs, dateRange]);

  const resetFilter = () => {
    setDateRange({ start: '', end: '' });
    setFilteredLogs(attendanceLogs);
  };

  const handleSort = (key: keyof AttendanceLog) => {
    const ascending = sortConfig.key === key ? !sortConfig.ascending : true;
    setSortConfig({ key, ascending });
    setFilteredLogs(prevLogs =>
      [...prevLogs].sort((a, b) => {
        if (key === 'date') {
          const dateA = new Date(a[key].split('/').reverse().join('-'));
          const dateB = new Date(b[key].split('/').reverse().join('-'));
          return ascending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }
        if (key === 'workingTime') {
          const getMinutes = (time: string) => {
            if (time === '-') return 0;
            const match = time.match(/(\d+)h(\d+)p/);
            return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : parseInt(time.replace('p', '')) || 0;
          };
          const minutesA = getMinutes(a[key]);
          const minutesB = getMinutes(b[key]);
          return ascending ? minutesA - minutesB : minutesB - minutesA;
        }
        return ascending ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
      })
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      navigate('/login');
    }
  };

  const handleExport = async () => {
    console.log('Starting export process...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch sử điểm danh');

    // Định nghĩa header
    const headers = ['Tên', 'Ngày', 'Thứ', 'Trạng thái', 'Check-in', 'Check-out', 'Thời gian làm việc'];
    worksheet.addRow(headers);

    // Áp dụng style cho header
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006400' },
      };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
    });

    // Thêm dữ liệu và áp dụng màu sắc
    filteredLogs.forEach((log, index) => {
      const row = worksheet.addRow([
        log.fullName,
        log.date,
        log.dayOfWeek,
        log.status,
        log.checkIn || 'Không có',
        log.checkOut || 'Không có',
        log.workingTime || '-',
      ]);

      // Áp dụng màu nền xen kẽ
      const fillColor = index % 2 === 0 ? 'F7F7F7' : 'FFFFFF';
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });

      // Áp dụng màu cho cột Trạng thái
      const statusCell = row.getCell(4);
      const statusColor = (() => {
        switch (log.status) {
          case 'Đi trễ':
          case 'Về sớm':
            return 'FFFF00';
          case 'Vắng mặt':
            return 'FF3333';
          case 'Vào làm':
          case 'Tan ca':
            return '66CC66';
          case 'Ra ngoài':
          case 'Vào lại':
            return '6699FF';
          default:
            return 'FFFFFF';
        }
      })();
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor },
      };
    });

    // Đặt độ rộng cột
    worksheet.columns = [
      { width: 20 }, // Tên
      { width: 12 }, // Ngày
      { width: 10 }, // Thứ
      { width: 12 }, // Trạng thái
      { width: 15 }, // Check-in
      { width: 15 }, // Check-out
      { width: 18 }, // Thời gian làm việc
    ];

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diemdanh_${employee?.fullName || 'nhanvien'}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log('Export completed');
  };

  const getIssues = () => {
    return filteredLogs.filter(log => ['Đi trễ', 'Vắng mặt', 'Về sớm'].includes(log.status));
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">Đang tải dữ liệu...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;

  return (
    <div className="flex bg-gray-100 font-sans min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <input
              type="text"
              placeholder="🔍 Tìm kiếm..."
              className="w-1/2 px-4 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-3">
                <img src="/images/images.jpeg" alt="Ảnh admin" className="w-12 h-12 rounded-full object-cover" />
                <div className="text-sm">
                  <div className="font-semibold">{userInfo?.name || 'Tên admin'}</div>
                  <div className="text-gray-500 text-xs">{userInfo?.email || 'mail admin'}</div>
                </div>
              </div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-40">
                <a href="/admin/profile" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Xem hồ sơ</a>
                <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đổi mật khẩu</a>
                <button onClick={handleLogout} className="block w-full text-center px-4 py-2 hover:bg-gray-100 text-sm">Đăng xuất</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/staff')}
                className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center hover:bg-teal-600 transition mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-semibold">Thông tin nhân viên</h2>
            </div>
          </div>
          {employee ? (
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={`https://randomuser.me/api/portraits/men/${employee.employeeId % 100}.jpg`}
                alt="Ảnh nhân viên"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold">{employee.fullName}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {employee.isActive ? 'Đang làm' : 'Vắng mặt'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                  <p><span className="font-medium">Chức vụ:</span> {employee.department}</p>
                  <p><span className="font-medium">SĐT:</span> {employee.phone}</p>
                  <p><span className="font-medium">Email:</span> {employee.email}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-lg font-bold">{stats?.totalAccess || 0}</p>
                    <p className="text-xs text-gray-600">Tổng lượt ra vào</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-lg font-bold">{stats?.avgCheckIn || 'Không có'}</p>
                    <p className="text-xs text-gray-600">Giờ vào trung bình</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-lg font-bold">{stats?.avgCheckOut || 'Không có'}</p>
                    <p className="text-xs text-gray-600">Giờ ra trung bình</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-lg font-bold">{stats?.employeeRating || 'Chưa xếp loại'}</p>
                    <p className="text-xs text-gray-600">Xếp loại nhân viên</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Không tìm thấy thông tin nhân viên.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-2xl font-semibold">Lịch sử điểm danh</h2>
            <div className="flex space-x-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Từ ngày"
              />
              <span>-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Đến ngày"
              />
              <button
                onClick={resetFilter}
                className="px-3 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                Xuất Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-gray-700">
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium"
                    onClick={() => handleSort('fullName')}
                  >
                    Tên {sortConfig.key === 'fullName' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium"
                    onClick={() => handleSort('date')}
                  >
                    Ngày {sortConfig.key === 'date' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium"
                    onClick={() => handleSort('dayOfWeek')}
                  >
                    Thứ {sortConfig.key === 'dayOfWeek' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium"
                    onClick={() => handleSort('status')}
                  >
                    Trạng thái {sortConfig.key === 'status' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium min-w-[120px]"
                    onClick={() => handleSort('checkIn')}
                  >
                    Check-in {sortConfig.key === 'checkIn' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium min-w-[120px]"
                    onClick={() => handleSort('checkOut')}
                  >
                    Check-out {sortConfig.key === 'checkOut' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-gray-200 font-medium min-w-[120px]"
                    onClick={() => handleSort('workingTime')}
                  >
                    Thời gian làm việc {sortConfig.key === 'workingTime' ? (sortConfig.ascending ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    let badgeClass = 'bg-green-100 text-green-700';
                    switch (log.status) {
                      case 'Đi trễ':
                        badgeClass = 'bg-yellow-100 text-yellow-700';
                        break;
                      case 'Vắng mặt':
                        badgeClass = 'bg-red-100 text-red-700';
                        break;
                      case 'Ra ngoài':
                      case 'Vào lại':
                        badgeClass = 'bg-blue-100 text-blue-700';
                        break;
                      case 'Về sớm':
                        badgeClass = 'bg-yellow-100 text-yellow-700';
                        break;
                      case 'Vào làm':
                      case 'Tan ca':
                        badgeClass = 'bg-green-100 text-green-700';
                        break;
                    }
                    return (
                      <tr key={index} className="border-t text-sm hover:bg-gray-50">
                        <td className="px-4 py-3">{log.fullName}</td>
                        <td className="px-4 py-3">{log.date}</td>
                        <td className="px-4 py-3">{log.dayOfWeek}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`} title={`Trạng thái: ${log.status}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{log.checkIn || 'Không có'}</td>
                        <td className="px-4 py-3">{log.checkOut || 'Không có'}</td>
                        <td className="px-4 py-3">{log.workingTime || '-'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                      Không tìm thấy dữ liệu điểm danh cho khoảng thời gian này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDetailPage;