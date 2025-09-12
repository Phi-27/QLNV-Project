import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BuildingCard from '../components/BuildingCard';
import '../css/styles.css';

interface Building {
  siteId: number;
  siteName: string;
  address: string;
  isActive: boolean;
}

const BuildingPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    siteName: '',
    address: '',
    isActive: true,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        await fetchUserInfo();
        await fetchBuildings();
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc liên hệ admin.');
        console.error('Error in init:', err);
      } finally {
        setLoading(false);
      }
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
      const user = await response.json();
      if (user.role?.trim() !== 'admin') {
        navigate('/employee');
      }
      setUserInfo(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      navigate('/login');
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/Site', { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Lỗi khi tải danh sách toà nhà: ${response.statusText} (Mã lỗi: ${response.status})` }));
        throw new Error(errorData.message || `Lỗi khi tải danh sách toà nhà: ${response.statusText} (Mã lỗi: ${response.status})`);
      }
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      setError('Không thể tải danh sách toà nhà: ' + (error as Error).message);
      console.error('Fetch buildings error:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredBuildings = buildings.filter(building =>
    building.siteName?.toLowerCase().includes(searchQuery) ||
    building.address?.toLowerCase().includes(searchQuery)
  );

  const openModal = (title: string, building?: Building) => {
    setModalTitle(title);
    setIsModalOpen(true);
    if (building) {
      setSelectedBuilding(building);
      setFormData({ siteName: building.siteName, address: building.address, isActive: building.isActive });
    } else {
      setSelectedBuilding(null);
      setFormData({ siteName: '', address: '', isActive: true });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ siteName: '', address: '', isActive: true });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? value === 'true' : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const buildingData = {
      siteName: formData.siteName,
      address: formData.address,
      isActive: formData.isActive, // Already a boolean due to handleFormChange
    };
    const url = selectedBuilding ? `/api/Site/${selectedBuilding.siteId}` : '/api/Site';
    const method = selectedBuilding ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(buildingData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Lỗi khi lưu: ${response.statusText} (Mã lỗi: ${response.status})` }));
        throw new Error(errorData.message || `Lỗi khi lưu: ${response.statusText} (Mã lỗi: ${response.status})`);
      }
      const result = await response.json();
      alert(result.message || 'Lưu thành công');
      closeModal();
      fetchBuildings();
    } catch (error) {
      console.error('Save building error:', error);
      alert('Lỗi khi lưu: ' + (error as Error).message);
    }
  };

  const openDeleteModal = (siteId: number) => {
    setBuildingToDelete(siteId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBuildingToDelete(null);
  };

  const handleDelete = async () => {
    if (buildingToDelete === null) return;
    try {
      const response = await fetch(`/api/Site/${buildingToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Lỗi khi xóa: ${response.statusText} (Mã lỗi: ${response.status})` }));
        throw new Error(errorData.message || `Lỗi khi xóa: ${response.statusText} (Mã lỗi: ${response.status})`);
      }
      const result = await response.json();
      alert(result.message || 'Xóa thành công');
      fetchBuildings();
      closeDeleteModal();
    } catch (error) {
      console.error('Delete building error:', error);
      alert('Lỗi khi xóa: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;

  return (
    <div className="flex bg-gray-100 font-sans">
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow header">
          <div className="flex items-center justify-between px-6 py-2">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-1/2 px-4 py-2 border rounded-full shadow-sm"
              />
              <button
                onClick={() => openModal('Thêm toà nhà')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Thêm toà nhà
              </button>
            </div>
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
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
            {filteredBuildings.length > 0 ? (
              filteredBuildings.map(building => (
                <BuildingCard
                  key={building.siteId}
                  building={building}
                  onEdit={() => openModal('Sửa toà nhà', building)}
                  onDelete={() => openDeleteModal(building.siteId)}
                />
              ))
            ) : (
              <p className="text-center text-gray-500">Không có toà nhà nào để hiển thị.</p>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <span className="close-modal absolute top-2 right-2 text-xl cursor-pointer" onClick={closeModal}>×</span>
            <h2 className="text-xl font-semibold mb-2">{modalTitle}</h2>
            <form onSubmit={handleSave}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Tên toà nhà</label>
                <input
                  type="text"
                  name="siteName"
                  value={formData.siteName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  name="isActive"
                  value={formData.isActive.toString()}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Ngừng hoạt động</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="btn-action cancel-btn">
                  Hủy
                </button>
                <button type="submit" className="btn-action save-btn">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-2">Xác nhận xóa</h2>
            <p className="mb-4">Bạn có chắc chắn muốn xóa toà nhà "{buildings.find(b => b.siteId === buildingToDelete)?.siteName}" không?</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="btn-action cancel-btn">Hủy</button>
              <button onClick={handleDelete} className="btn-action delete-btn">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingPage;