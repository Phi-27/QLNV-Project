import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faEdit, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import '../css/styles.css';

interface Employee {
  employeeId: number;
  fullName: string;
  department: string;
  phone: string;
  email: string;
  password: string;
  isActive: boolean;
  latestCheckInStatus: string;
  employeeCode?: string;
  memberCard?: string; // Thêm trường memberCard
  checkIn?: string;
  checkOut?: string;
}

const StaffPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    employeeCode: '',
    department: '',
    email: '',
    password: '',
    phone: '',
    accessPointId: '',
    memberCard: '' // Thêm trường memberCard vào formData
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(5);
  const navigate = useNavigate();

  const getRandomEmployeeImage = (employeeId: number) => {
    return `https://randomuser.me/api/portraits/men/${employeeId % 100}.jpg`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchUserInfo();
        await fetchEmployees();
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc liên hệ admin.');
        console.error('Error in init:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  },);

  const fetchUserInfo = async () => {
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
      console.error('Error fetching user info:', error);
      navigate('/login');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/Home', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error as Error);
      setError('Không thể tải danh sách nhân viên: ' + (error as Error).message);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.fullName?.toLowerCase().includes(searchQuery) ||
    employee.employeeCode?.toLowerCase().includes(searchQuery) ||
    employee.department?.toLowerCase().includes(searchQuery) ||
    employee.email?.toLowerCase().includes(searchQuery) ||
    employee.memberCard?.toLowerCase().includes(searchQuery) // Thêm memberCard vào tìm kiếm
  );

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const openModal = (title: string, employee?: Employee) => {
    setModalTitle(title);
    setIsModalOpen(true);
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        fullName: employee.fullName,
        employeeCode: employee.employeeCode || '',
        department: employee.department,
        email: employee.email,
        password: '',
        phone: employee.phone,
        accessPointId: '',
        memberCard: employee.memberCard || '' // Khởi tạo memberCard cho sửa
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        fullName: '',
        employeeCode: '',
        department: '',
        email: '',
        password: '',
        phone: '',
        accessPointId: '',
        memberCard: '' // Khởi tạo rỗng cho thêm mới
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      fullName: '',
      employeeCode: '',
      department: '',
      email: '',
      password: '',
      phone: '',
      accessPointId: '',
      memberCard: ''
    });
    setShowPassword(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'department' && !selectedEmployee) {
      generateEmployeeCode(value);
      updateAccessPoint(value);
    }
  };

  const updateAccessPoint = (department: string) => {
    const departmentToAccessPoint = {
      "Kỹ thuật": 1,
      "Kế toán": 2,
      "Kho": 3,
      "Marketing": 4,
      "Giám đốc": 5
    };
    const accessPointId = departmentToAccessPoint[department as keyof typeof departmentToAccessPoint] || null;
    setFormData(prev => ({ ...prev, accessPointId: accessPointId?.toString() || '' }));
  };

  const generateEmployeeCode = (department: string) => {
    const departmentPrefixes = {
      "Kỹ thuật": "KTN",
      "Kế toán": "KT",
      "Giám đốc": "GD",
      "Marketing": "MKT",
      "Kho": "KHO"
    };
    const prefix = departmentPrefixes[department as keyof typeof departmentPrefixes] || "NV";
    const existingCodes = employees
      .filter(emp => emp.employeeCode?.startsWith(prefix))
      .map(emp => emp.employeeCode);
    let number = 1;
    let newCode: string;
    do {
      newCode = `${prefix}${String(number).padStart(3, '0')}`;
      number++;
    } while (existingCodes.includes(newCode));
    setFormData(prev => ({ ...prev, employeeCode: newCode }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeData = {
      FullName: formData.fullName,
      EmployeeCode: formData.employeeCode,
      MemberCard: formData.memberCard, // Thêm MemberCard vào request
      Department: formData.department,
      Role: "Nhân viên",
      AccessPointId: parseInt(formData.accessPointId) || null,
      Email: formData.email,
      Password: formData.password || undefined,
      Phone: formData.phone,
      IsActive: true,
    };
    const url = selectedEmployee ? `/api/Home/${selectedEmployee.employeeId}` : '/api/Home';
    const method = selectedEmployee ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const result = await response.json();
      alert(result.message);
      closeModal();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error as Error);
      alert('Lỗi khi lưu: ' + (error as Error).message);
    }
  };

  const openDeleteModal = (employeeId: number) => {
    setEmployeeToDelete(employeeId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleDelete = async () => {
    if (employeeToDelete === null) return;
    try {
      const response = await fetch(`/api/Home/${employeeToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const result = await response.json();
      alert(result.message);
      fetchEmployees();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting employee:', error as Error);
      alert('Lỗi khi xoá: ' + (error as Error).message);
    }
  };

  const handleViewEmployee = (employeeId: number) => {
    navigate(`/staff-detail?id=${employeeId}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/Auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error as Error);
      navigate('/login');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;

  return (
    <div className="flex bg-gray-100 font-sans min-h-screen">
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <img src="/images/Logo-SpeedPos.webp" alt="Speed POS" className="h-8" />
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên, Mã NV, Mã thẻ, Chức vụ, Email..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-1/2 px-4 py-2 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => openModal('Thêm nhân viên')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Thêm nhân viên
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
          <div className="flex-1 ml-4 overflow-x-auto">
            {filteredEmployees.length > 0 ? (
              <>
                <table className="w-full bg-white rounded-lg shadow table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm">
                      <th className="px-4 py-3 text-left font-medium">Ảnh</th>
                      <th className="px-4 py-3 text-left font-medium">Tên</th>
                      <th className="px-4 py-3 text-left font-medium">Mã NV</th>
                      <th className="px-4 py-3 text-left font-medium">Mã thẻ</th> {/* Thêm cột Mã thẻ */}
                      <th className="px-4 py-3 text-left font-medium">Chức vụ</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Số điện thoại</th>
                      <th className="px-4 py-3 text-left font-medium">Check In</th>
                      <th className="px-4 py-3 text-left font-medium">Check Out</th>
                      <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                      <th className="px-4 py-3 text-center font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {currentEmployees.map(employee => {
                      let badgeClass = 'bg-green-100 text-green-700';
                      switch (employee.latestCheckInStatus) {
                        case 'Đi trễ':
                        case 'Về sớm':
                          badgeClass = 'bg-yellow-100 text-yellow-700';
                          break;
                        case 'Vắng mặt':
                          badgeClass = 'bg-red-100 text-red-700';
                          break;
                        case 'Ra ngoài':
                        case 'Vào lại':
                          badgeClass = 'bg-blue-100 text-blue-700';
                          break;
                        case 'Vào làm':
                        case 'Tan ca':
                          badgeClass = 'bg-green-100 text-green-700';
                          break;
                      }
                      return (
                        <tr key={employee.employeeId} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <img
                              src={getRandomEmployeeImage(employee.employeeId)}
                              alt={employee.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          </td>
                          <td className="px-4 py-3">{employee.fullName}</td>
                          <td className="px-4 py-3">{employee.employeeCode || '-'}</td>
                          <td className="px-4 py-3">{employee.memberCard || '-'}</td> {/* Hiển thị MemberCard */}
                          <td className="px-4 py-3">{employee.department}</td>
                          <td className="px-4 py-3">{employee.email}</td>
                          <td className="px-4 py-3">{employee.phone}</td>
                          <td className="px-4 py-3">{employee.checkIn || '-'}</td>
                          <td className="px-4 py-3">{employee.checkOut || '-'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
                              title={`Trạng thái: ${employee.latestCheckInStatus}`}
                            >
                              {employee.latestCheckInStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewEmployee(employee.employeeId)}
                              className="text-green-600 hover:text-green-800 mr-2"
                              title="Xem nhân viên"
                            >
                              <FontAwesomeIcon icon={faUser} />
                            </button>
                            <button
                              onClick={() => openModal('Sửa nhân viên', employee)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              title="Sửa nhân viên"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(employee.employeeId)}
                              className="text-red-600 hover:text-red-800"
                              title="Xóa nhân viên"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-4 py-2 mx-1 ${
                        currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      } rounded`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">Không có nhân viên nào để hiển thị.</p>
            )}
          </div>
        </div>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative modal-content">
            <span className="close-modal absolute top-2 right-2 text-xl cursor-pointer" onClick={closeModal}>
              ×
            </span>
            <h2 className="text-xl font-semibold mb-4">{modalTitle}</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tên nhân viên</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Mã nhân viên</label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Mã thẻ thành viên</label>
                <input
                  type="text"
                  name="memberCard"
                  value={formData.memberCard}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn chức vụ</option>
                  <option value="Kỹ thuật">Kỹ thuật</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Giám đốc">Giám đốc</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Kho">Kho</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4 password-wrapper">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="new-password"
                  required={!selectedEmployee}
                />
                <span
                  className={`toggle-password ${formData.password ? 'visible' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-action cancel-btn"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-action save-btn"
                >
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
            <h2 className="text-xl font-semibold mb-4">Xác nhận xóa</h2>
            <p className="mb-4">
              Bạn có chắc chắn muốn xóa nhân viên "
              {employees.find(e => e.employeeId === employeeToDelete)?.fullName}" không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="btn-action cancel-btn"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="btn-action delete-btn"
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
export default StaffPage;