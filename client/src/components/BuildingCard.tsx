import React from 'react';

interface Building {
  siteId: number;
  siteName: string;
  address: string;
  isActive: boolean;
}

interface BuildingCardProps {
  building: Building;
  onEdit: () => void;
  onDelete: () => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, onEdit, onDelete }) => {
  const statusColor = building.isActive ? 'text-green-600' : 'text-red-600';
  const statusText = building.isActive ? 'Hoạt động' : 'Ngừng hoạt động';

  return (
    <div className="bg-white p-4 rounded shadow employee-card" data-id={building.siteId}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600">{building.siteName.charAt(0)}</span>
        </div>
        <div>
          <div className="font-semibold">{building.siteName || 'Chưa có tên'}</div>
          <div className="text-sm text-gray-500">Địa chỉ: {building.address || 'Chưa có'}</div>
          <div className={`text-sm ${statusColor}`}>{statusText}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-sm text-gray-600">
        <a href={`/building-detail?id=${building.siteId}`} className="hover:text-blue-500">👁️ Xem</a>
        <button onClick={onEdit} className="hover:text-blue-500">✏️ Sửa</button>
        <button onClick={onDelete} className="hover:text-red-500">🗑️ Xoá</button>
      </div>
    </div>
  );
};

export default BuildingCard;