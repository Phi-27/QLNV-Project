import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../css/styles.css';

interface Building {
  siteId: number;
  siteName: string;
  address: string;
  isActive: boolean;
}

interface Stats {
  totalAccess: number;
  avgCheckIn: string;
  avgCheckOut: string;
}

const BuildingDetailPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ siteName: '', address: '', isActive: true });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const siteId = queryParams.get('id');

  useEffect(() => {
    const init = async () => {
      try {
        await fetchUserInfo();
        if (siteId) {
          await fetchBuildingDetails();
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc liên hệ admin.');
        console.error('Error in init:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [siteId]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/Auth/user', { credentials: 'include' });
      if (!response.ok) {
        navigate('/login');
        return;
      }
      const user = await response.json();
      if (user.role?.trim() !== 'admin') {
        navigate('/employee');
      }
      setUserInfo(user);
    } catch (error) {
      navigate('/login');
    }
  };

  const fetchBuildingDetails = async () => {
    try {
      const response = await fetch(`/api/Site/${siteId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch building details');
      const data = await response.json();
      setBuilding(data);
      setFormData({ siteName: data.siteName, address: data.address, isActive: data.isActive });
      setStats({ totalAccess: 0, avgCheckIn: 'N/A', avgCheckOut: 'N/A' }); // Placeholder stats
    } catch (error) {
      setError('Không thể tải thông tin toà nhà: ' + (error as Error).message);
    }
  };

  const handleEdit = () => setIsEditMode(true);
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (building) setFormData({ siteName: building.siteName, address: building.address, isActive: building.isActive });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = { siteName: formData.siteName, address: formData.address, isActive: formData.isActive };
    try {
      const response = await fetch(`/api/Site/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update building');
      const result = await response.json();
      alert(result.message || 'Cập nhật thành công');
      setIsEditMode(false);
      fetchBuildingDetails();
    } catch (error) {
      alert('Lỗi khi cập nhật: ' + (error as Error).message);
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/Site/${siteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete building');
      const result = await response.json();
      alert(result.message);
      navigate('/building');
    } catch (error) {
      alert('Lỗi khi xoá: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (error || !building) return <div className="flex justify-center items-center h-screen text-red-600">{error || 'Không tìm thấy toà nhà.'}</div>;

  return (
    <div className="flex bg-gray-100 font-sans">
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow header">
          <div className="flex items-center justify-between px-6 py-4">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <input type="text" placeholder="🔍 Tìm kiếm..." className="w-1/2 px-4 py-2 border rounded-full shadow-sm" />
            <div className="relative group cursor-pointer">
              <div className="flex items-center space-x-3">
                <img src="/images/images.jpeg" alt="Ảnh admin" className="w-12 h-12 rounded-full object-cover" />
                <div className="text-sm">
                  <div className="font-semibold">{userInfo?.name || 'Tên admin'}</div>
                  <div className="text-gray-500 text-xs">{userInfo?.email || 'mail admin'}</div>
                </div>
              </div>
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-50">
                <a href="/admin/profile" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Xem hồ sơ</a>
                <a href="/admin/change-password" className="text-center block px-4 py-2 hover:bg-gray-100 text-sm">Đổi mật khẩu</a>
                <button onClick={handleLogout} className="block w-full text-center px-4 py-2 hover:bg-gray-100 text-sm">Đăng xuất</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex mt-6">
          <Sidebar />
          <div className="flex-1 gap-4 ml-4">
            {!isEditMode ? (
              <div className="bg-gray-700 text-white rounded-lg p-6 mb-6 employee-info">
                <div className="flex items-center mb-4">
                  <button onClick={() => navigate('/building')} className="w-12 h-12 rounded-full bg-[#255e7c] flex items-center justify-center hover:bg-[#1e4b63] transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-semibold ml-3">Thông tin toà nhà</h2>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-2xl">{building.siteName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{building.siteName}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <p><span className="font-medium">Địa chỉ:</span> {building.address}</p>
                      <p><span className="font-medium">Trạng thái:</span> {building.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</p>
                    </div>
                  </div>
                </div>               
                <div className="space-x-2 mt-4">
                  <button onClick={handleEdit} className="hover:text-yellow-500">✏️ Sửa</button>
                  <button onClick={openDeleteModal} className="hover:text-red-500">🗑️ Xóa</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow mt-6">
                <h2 className="text-xl font-semibold mb-4">Chỉnh sửa toà nhà</h2>
                <form onSubmit={handleSave}>
                  <div className="mb-4">
                    <label htmlFor="editName" className="block mb-1 font-medium">Tên toà nhà</label>
                    <input
                      type="text"
                      id="editName"
                      name="siteName"
                      value={formData.siteName}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="editAddress" className="block mb-1 font-medium">Địa chỉ</label>
                    <input
                      type="text"
                      id="editAddress"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="editStatus" className="block mb-1 font-medium">Trạng thái</label>
                    <select
                      id="editStatus"
                      name="isActive"
                      value={formData.isActive.toString()}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Ngừng hoạt động</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="modal-button cancel"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="modal-button save"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Xác nhận xóa</h2>
            <p className="mb-4">Bạn có chắc chắn muốn xóa toà nhà "{building.siteName}" không?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 rounded min-w-[100px] text-center hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded min-w-[100px] text-center hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingDetailPage;