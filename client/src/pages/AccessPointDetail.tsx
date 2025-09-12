import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../css/styles.css';

// Thống nhất interface với AccessPointPage
interface AccessPoint {
  accessPointId: number;
  accessName: string;
  location: string;
  siteId?: number;
  deviceType?: string;
  deviceData?: string;
  isActive: boolean;
  createdDate?: string;
  modifiedDate?: string;
  siteName?: string;
  address?: string;
}

interface AccessLog {
  accessLogId?: number;
  accessPointId?: number;
  fullName?: string;
  accessTime?: string;
  accessResult?: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  role?: string;
}

interface EditFormData {
  siteName: string;
  accessName: string;
  location: string;
  address: string;
  deviceType: string;
  isActive: boolean;
}

const AccessPointDetail: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accessPoint, setAccessPoint] = useState<AccessPoint | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const accessPointId = searchParams.get('id');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const isAuthenticated = await fetchUserInfo();
        console.log('Authentication result:', isAuthenticated);
        if (isAuthenticated && accessPointId) {
          await fetchAccessPointDetails();
        } else {
          setError('Không thể xác thực hoặc thiếu ID Access Point.');
          navigate('/login');
        }
      } catch (err) {
        console.error('Error in init:', err instanceof Error ? err.message : 'Unknown error');
        setError('Lỗi khi khởi tạo: ' + (err instanceof Error ? err.message : 'Unknown error'));
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [accessPointId, navigate]);

  const fetchUserInfo = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/Auth/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('User Info Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        ok: response.ok,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log('User Info Error:', errorText);
        throw new Error(`Unauthorized or server error (Status: ${response.status}) - ${errorText}`);
      }
      const user = await response.json();
      console.log('User Info Data:', user);
      setUserInfo(user);
      if (user.role?.toString().trim() !== 'admin') {
        alert('Bạn không có quyền truy cập trang này.');
        navigate('/staff');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error fetching user info:', error instanceof Error ? error.message : 'Unknown error');
      setError('Lỗi khi lấy thông tin người dùng: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  };

  const fetchAccessPointDetails = async () => {
    if (!accessPointId) {
      setError('Không tìm thấy ID Access Point.');
      navigate(-1);
      return;
    }
    try {
      const response = await fetch(`/api/AccessPoint/${accessPointId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('Access Point Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        ok: response.ok,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Access Point Error:', errorText);
        throw new Error(`Không thể lấy thông tin Access Point: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('Access Point Data:', data);
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Dữ liệu Access Point rỗng.');
      }
      setAccessPoint(data);
    } catch (error) {
      console.error('Error fetching access point details:', error instanceof Error ? error.message : 'Unknown error');
      setError('Lỗi khi tải thông tin thiết bị: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchAccessLogs = async () => {
    if (!accessPointId) return;
    try {
      const response = await fetch(`/api/AccessLog?accessPointId=${accessPointId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('Access Logs Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        ok: response.ok,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Access Logs Error:', errorText);
        throw new Error(`Không thể lấy lịch sử truy cập: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('Access Logs Data:', data);
      const filteredLogs = Array.isArray(data.data) ? data.data.filter((log: AccessLog) => log.accessPointId === parseInt(accessPointId)) : [];
      setAccessLogs(filteredLogs);
    } catch (error) {
      console.error('Error fetching access logs:', error instanceof Error ? error.message : 'Unknown error');
      setError('Lỗi khi tải lịch sử: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessPointId || !accessPoint) return;
    const formData: EditFormData = {
      siteName: (document.getElementById('editTenKhuVuc') as HTMLInputElement).value,
      accessName: (document.getElementById('editMaSite') as HTMLInputElement).value,
      location: (document.getElementById('editToaNha') as HTMLInputElement).value +
        (!((document.getElementById('editMaSite') as HTMLInputElement).value.includes('Cổng'))
          ? ' Cổng ' + (document.getElementById('editMaSite') as HTMLInputElement).value
          : ''),
      address: (document.getElementById('editAddress') as HTMLInputElement).value,
      deviceType: (document.getElementById('editSoTang') as HTMLInputElement).value,
      isActive: (document.getElementById('editTrangThai') as HTMLSelectElement).value === 'true',
    };
    try {
      const response = await fetch(`/api/AccessPoint/${accessPointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      console.log('Save Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật Access Point');
      }
      const result = await response.json();
      alert(result.message || 'Cập nhật thành công.');
      await fetchAccessPointDetails();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating access point:', error instanceof Error ? error.message : 'Unknown error');
      alert('Lỗi khi cập nhật: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!accessPointId || !window.confirm('Bạn có chắc chắn muốn xoá thiết bị này không?')) return;
    try {
      const response = await fetch(`/api/AccessPoint/${accessPointId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      console.log('Delete Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể xoá Access Point');
      }
      const result = await response.json();
      alert(result.message);
      navigate('/access-point');
    } catch (error) {
      console.error('Error deleting access point:', error instanceof Error ? error.message : 'Unknown error');
      alert('Lỗi khi xoá: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    if (accessPoint) fetchAccessLogs();
  }, [accessPoint]);

  const getStatusStyle = (isActive?: boolean) => {
    return isActive ? { text: 'Hoạt động', color: 'bg-green-500' } : { text: 'Ngưng hoạt động', color: 'bg-red-600' };
  };

  return (
    <div className="flex bg-gray-100 font-sans min-h-screen">
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
                  <div className="font-semibold" id="user-name">{userInfo?.name || 'Tên admin'}</div>
                  <div className="text-gray-500 text-xs" id="user-email">{userInfo?.email || 'mail admin'}</div>
                </div>
              </div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                <a href="/admin" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Xem hồ sơ</a>
                <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đổi mật khẩu</a>
                <a href="/login" className="block px-4 py-2 hover:bg-gray-100 text-sm text-center">Đăng xuất</a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex mt-6">
          <Sidebar />
          <div className="flex-1 gap-4 ml-4">
            <div className="bg-gray-700 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => navigate(-1)}
                  className="w-12 h-12 rounded-full bg-[#255e7c] flex items-center justify-center hover:bg-[#1e4b63] transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold ml-3">Thông tin thiết bị</h2>
              </div>
              {loading ? (
                <div className="text-center">Đang tải...</div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : accessPoint ? (
                <>
                  <div className="grid grid-cols-1 gap-y-2 text-sm mb-4">
                    <div className="flex">
                      <span className="w-32 font-medium">Tên khu vực:</span>
                      <span>{accessPoint.siteName || 'Không có tên khu vực'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Mã thiết bị:</span>
                      <span>{accessPoint.accessName || 'Không có mã thiết bị'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Tên phòng:</span>
                      <span>{accessPoint.location?.split('Cổng')[0].trim() || 'Không có tên phòng'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Địa chỉ:</span>
                      <span>{accessPoint.address || 'Không có địa chỉ'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Loại:</span>
                      <span>{accessPoint.deviceType || 'Không có loại'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 font-medium">Trạng thái:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${getStatusStyle(accessPoint.isActive).color} inline-block`}></span>
                        <span>{getStatusStyle(accessPoint.isActive).text}</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className={`grid grid-cols-1 gap-y-3 text-sm mt-8 border-t pt-6 ${isEditing ? '' : 'hidden'}`}>
                    <div className="flex">
                      <label className="w-32 font-medium">Tên khu vực:</label>
                      <input
                        type="text"
                        id="editTenKhuVuc"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.siteName || ''}
                      />
                    </div>
                    <div className="flex">
                      <label className="w-32 font-medium">Mã thiết bị:</label>
                      <input
                        type="text"
                        id="editMaSite"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.accessName || ''}
                      />
                    </div>
                    <div className="flex">
                      <label className="w-32 font-medium">Tên phòng:</label>
                      <input
                        type="text"
                        id="editToaNha"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.location?.split('Cổng')[0].trim() || ''}
                      />
                    </div>
                    <div className="flex">
                      <label className="w-32 font-medium">Địa chỉ:</label>
                      <input
                        type="text"
                        id="editAddress"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.address || ''}
                      />
                    </div>
                    <div className="flex">
                      <label className="w-32 font-medium">Loại:</label>
                      <input
                        type="text"
                        id="editSoTang"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.deviceType || ''}
                      />
                    </div>
                    <div className="flex">
                      <label className="w-32 font-medium">Trạng thái:</label>
                      <select
                        id="editTrangThai"
                        className="flex-1 px-3 py-2 rounded text-black"
                        defaultValue={accessPoint.isActive?.toString() || 'false'}
                      >
                        <option value="true">Hoạt động</option>
                        <option value="false">Ngưng hoạt động</option>
                      </select>
                    </div>
                    <div className="mt-4 space-x-2">
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        💾 Lưu
                      </button>
                      <button type="button" onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                        ❌ Hủy
                      </button>
                    </div>
                  </form>

                  <div className="space-x-2 mt-4">
                    <button onClick={handleEdit} className="hover:text-yellow-500">✏️ Sửa</button>
                    <button onClick={handleDelete} className="hover:text-red-500">🗑️ Xoá</button>
                  </div>
                </>
              ) : (
                <div className="text-center">Không có dữ liệu Access Point.</div>
              )}
            </div>

            <div className="bg-gray-700 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-2 h-5 bg-blue-500 rounded-sm mr-2"></div>
                <h2 className="text-lg font-semibold">Lịch sử truy cập</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-white">
                  <thead className="border-b border-gray-500">
                    <tr>
                      <th className="py-2 px-4">Người dùng</th>
                      <th className="py-2 px-4">Thời gian</th>
                      <th className="py-2 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="py-2 px-4 text-center">Đang tải...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={3} className="py-2 px-4 text-center text-red-600">{error}</td></tr>
                    ) : accessLogs.length > 0 ? (
                      accessLogs.map((log) => (
                        <tr key={log.accessLogId} className="border-t border-gray-600">
                          <td className="py-2 px-4">{log.fullName || 'Không có tên'}</td>
                          <td className="py-2 px-4">{new Date(log.accessTime || '').toLocaleString('vi-VN') || 'Không có thời gian'}</td>
                          <td className={`py-2 px-4 flex items-center space-x-2 ${log.accessResult?.toLowerCase() === 'thành công' ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{log.accessResult?.toLowerCase() === 'thành công' ? '✔️' : '❌'}</span>
                            <span>{log.accessResult || 'Không rõ'}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="py-2 px-4 text-center">Không có lịch sử truy cập.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccessPointDetail;