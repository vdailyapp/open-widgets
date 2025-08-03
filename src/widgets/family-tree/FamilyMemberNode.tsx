import React, { useState } from 'react';
import { User, Edit2, X, Calendar, FileText } from 'lucide-react';
import type { FamilyMember } from './types';
import { formatDate, calculateAge } from './utils';
import { useFamilyTreeStore } from './store';

interface FamilyMemberNodeProps {
  member: FamilyMember;
  onDragStart?: (e: React.DragEvent, member: FamilyMember) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  scale?: number;
}

const FamilyMemberNode: React.FC<FamilyMemberNodeProps> = ({
  member,
  onDragStart,
  onDragEnd,
  isDragging,
  scale = 1,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { 
    selectedMember, 
    setSelectedMember, 
    setIsEditingMember, 
    deleteMember,
    settings 
  } = useFamilyTreeStore();
  
  const isSelected = selectedMember === member.id;
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMember(member.id);
    setIsEditingMember(true);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      deleteMember(member.id);
    }
  };
  
  const handleClick = () => {
    setSelectedMember(isSelected ? null : member.id);
  };
  
  const genderColor = {
    male: 'bg-blue-100 border-blue-300 text-blue-800',
    female: 'bg-pink-100 border-pink-300 text-pink-800',
    other: 'bg-gray-100 border-gray-300 text-gray-800',
  }[member.gender];
  
  const selectedClass = isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : '';
  const draggingClass = isDragging ? 'opacity-50' : '';
  
  return (
    <div
      className={`relative ${draggingClass}`}
      style={{
        transform: `translate(${member.x || 0}px, ${member.y || 0}px) scale(${scale})`,
        position: 'absolute',
        transformOrigin: 'center',
      }}
    >
      {/* Main Node */}
      <div
        className={`
          relative cursor-pointer p-3 rounded-lg border-2 shadow-md
          hover:shadow-lg transition-all duration-200 min-w-32 max-w-48
          ${genderColor} ${selectedClass}
          ${settings.theme === 'dark' ? 'dark:bg-gray-800 dark:border-gray-600' : ''}
        `}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        draggable
        onDragStart={(e) => onDragStart?.(e, member)}
        onDragEnd={onDragEnd}
      >
        {/* Photo */}
        {settings.showPhotos && member.photo && (
          <div className="mb-2 flex justify-center">
            <img
              src={member.photo}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        )}
        
        {/* Photo placeholder */}
        {settings.showPhotos && !member.photo && (
          <div className="mb-2 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        )}
        
        {/* Name */}
        <div className="text-center font-semibold text-sm mb-1 break-words">
          {member.name}
        </div>
        
        {/* Dates */}
        {settings.showDates && (member.birthDate || member.deathDate) && (
          <div className="text-xs text-center opacity-75 mb-1">
            {formatDate(member.birthDate)}
            {member.deathDate && ` - ${formatDate(member.deathDate)}`}
            {!member.deathDate && member.birthDate && (
              <div className="text-xs">({calculateAge(member.birthDate)})</div>
            )}
          </div>
        )}
        
        {/* Actions */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={handleEdit}
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
              title="Delete"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && (member.notes || member.birthDate || member.deathDate) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs rounded shadow-lg z-50 max-w-64">
          <div className="whitespace-pre-wrap break-words">
            {member.birthDate && (
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Born: {formatDate(member.birthDate)}</span>
              </div>
            )}
            {member.deathDate && (
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Died: {formatDate(member.deathDate)}</span>
              </div>
            )}
            {member.birthDate && (
              <div className="text-xs opacity-75 mb-1">
                {calculateAge(member.birthDate, member.deathDate)}
              </div>
            )}
            {settings.showNotes && member.notes && (
              <div className="flex items-start gap-1">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{member.notes}</span>
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberNode;