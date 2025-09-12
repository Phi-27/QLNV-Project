import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface AccessPointDTO {
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

const AccessPointPage: React.FC = () => {
  const [accessPoints, setAccessPoints] = useState<AccessPointDTO[]>([]);
  const [filteredAccessPoints, setFilteredAccessPoints] = useState<AccessPointDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState({ name: 'Tên admin', email: 'mail admin' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
    fetchAccessPoints();
  }, []);

  useEffect(() => {
    const filtered = accessPoints.filter(ap =>
      ap.accessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ap.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (ap.location.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );
    setFilteredAccessPoints(filtered);
  }, [searchTerm, accessPoints]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/Auth/user', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Unauthorized');
      const user = await response.json();
      const role = user.role?.toString().trim();
      if (role !== 'admin') {
        navigate('/staff');
        return;
      }
      setUserInfo({
        name: user.name || 'Tên admin',
        email: user.email || 'mail admin',
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      navigate('/login');
    }
  };

  const fetchAccessPoints = async () => {
    try {
      const response = await fetch('/api/AccessPoint', {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch access points');
      }
      const data = await response.json();
      setAccessPoints(data);
      setFilteredAccessPoints(data);
    } catch (error) {
      console.error('Error fetching access points:', error);
      alert('Không thể tải danh sách Access Point: ' + (error as Error).message);
    }
  };

  const handleDeleteClick = (accessPointId: number, accessPointName: string) => {
    setItemToDelete({ id: accessPointId, name: accessPointName });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(`/api/AccessPoint/${itemToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete access point');
      }
      const result = await response.json();
      alert(result.message);
      await fetchAccessPoints();
    } catch (error) {
      console.error('Error deleting access point:', error);
      alert('Lỗi khi xoá: ' + (error as Error).message);
    } finally {
      setShowConfirmDialog(false);
      setItemToDelete(null);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/Auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  const getStatusInfo = (isActive: boolean) => {
    return {
      text: isActive ? 'Hoạt động' : 'Ngưng hoạt động',
      color: isActive ? 'text-green-600' : 'text-red-600',
    };
  };

  const getRoomName = (location: string | undefined) => {
    let roomName = location || 'Không có tên phòng';
    if (roomName.includes('Cổng')) {
      roomName = roomName.split('Cổng')[0].trim();
    }
    return roomName;
  };

  return (
    <div className="bg-gray-100 font-sans">
      {showConfirmDialog && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium mb-4">Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xoá thiết bị "{itemToDelete.name}"?</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowConfirmDialog(false)} className="px-4 py-2 border rounded hover:bg-gray-100">
                Hủy
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        <main className="flex-1 p-6">
          <div className="bg-white rounded-xl shadow header">
            <div className="flex items-center justify-between px-6 py-4">
              <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-1/2 px-4 py-2 border rounded-full shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="relative group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <img src="/images/images.jpeg" alt="Ảnh admin" className="w-12 h-12 rounded-full object-cover" />
                  <div className="text-sm">
                    <div className="font-semibold">{userInfo.name}</div>
                    <div className="text-gray-500 text-xs">{userInfo.email}</div>
                  </div>
                </div>
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                  <a href="/admin" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Xem hồ sơ</a>
                  <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đổi mật khẩu</a>
                  <a href="#" onClick={logout} className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đăng xuất</a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex mt-6">
            <Sidebar />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
              {filteredAccessPoints.map((ap) => {
                const status = getStatusInfo(ap.isActive);
                const roomName = getRoomName(ap.location);
                return (
                  <div key={ap.accessPointId} className="bg-white p-4 rounded shadow employee-card">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-semibold employee-name">{ap.siteName || 'Không có tên'}</div>
                        <div className="text-sm text-gray-500">Tên phòng: {roomName}</div>
                        <div className="text-sm text-gray-500">Khu vực: {ap.accessName || 'Không có khu vực'}</div>
                        <div className="text-sm text-gray-500">Loại: {ap.deviceType || 'Không có loại'}</div>
                        <div className={`text-sm ${status.color}`}>{status.text}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-gray-600">
                      <a href={`/access-point-detail?id=${ap.accessPointId}`} className="hover:text-blue-500">👁️ Xem</a>
                      <button
                        onClick={() => handleDeleteClick(ap.accessPointId, ap.siteName || '')}
                        className="hover:text-red-500 delete-button"
                      >
                        🗑️ Xoá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>         
        </main>
      </div>
    </div>
  );
};

export default AccessPointPage;