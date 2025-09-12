import React from 'react';

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
}

interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onDelete }) => {
  const getStatusColor = () => {
    if (!employee.isActive) return 'text-gray-600';
    switch (employee.latestCheckInStatus.trim()) {
      case 'Đi trễ':
        return 'text-red-600';
      case 'Tan ca':
      case 'Đúng giờ':
        return 'text-green-600';
      case 'Ra ngoài':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const statusText = employee.isActive ? employee.latestCheckInStatus : 'Vắng mặt';
  const statusColor = getStatusColor();

  return (
    <div className="bg-white p-4 rounded shadow employee-card" data-id={employee.employeeId}>
      <div className="flex items-center space-x-3">
        <img
          src={`https://randomuser.me/api/portraits/men/${employee.employeeId % 100}.jpg`}
          className="w-12 h-12 rounded-full"
          alt={employee.fullName}
        />
        <div>
          <div className="font-semibold employee-name">{employee.fullName || 'Không có tên'}</div>
          <div className="text-sm text-gray-500">Chức vụ: {employee.department || 'Không có'}</div>
          <div className="text-sm text-gray-500 flex items-center">
            📞: {employee.phone || 'Không có số điện thoại'}
          </div>
          <div className={`text-sm ${statusColor}`}>
            {statusText}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-sm text-gray-600">
        <a href={`/staff-detail?id=${employee.employeeId}`} className="hover:text-blue-500">👁️ Xem</a>
        <button onClick={onEdit} className="hover:text-blue-500 edit-button">✏️ Sửa</button>
        <button onClick={onDelete} className="hover:text-red-500 delete-button">🗑️ Xóa</button>
      </div>
    </div>
  );
};

export default EmployeeCard;