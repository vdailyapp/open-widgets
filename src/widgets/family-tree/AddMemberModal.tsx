import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, Image, Heart, Users, Baby } from 'lucide-react';
import type { FamilyMember, Relationship } from './types';
import { useFamilyTreeStore } from './store';
import { validateRelationship } from './utils';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMember?: FamilyMember | null;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, editingMember }) => {
  const { 
    addMember, 
    updateMember, 
    addRelationship, 
    members, 
    relationships,
    selectedMember 
  } = useFamilyTreeStore();
  
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    gender: 'other',
    birthDate: '',
    deathDate: '',
    photo: '',
    notes: '',
  });
  
  const [relationshipData, setRelationshipData] = useState<{
    type: 'parent-child' | 'spouse' | 'sibling' | '';
    targetMember: string;
    direction: 'to' | 'from'; // for parent-child: 'to' means adding child, 'from' means adding parent
  }>({
    type: '',
    targetMember: '',
    direction: 'to',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (editingMember) {
      setFormData(editingMember);
      setRelationshipData({ type: '', targetMember: '', direction: 'to' });
    } else {
      setFormData({
        name: '',
        gender: 'other',
        birthDate: '',
        deathDate: '',
        photo: '',
        notes: '',
      });
      setRelationshipData({
        type: '',
        targetMember: selectedMember || '',
        direction: 'to',
      });
    }
    setErrors({});
  }, [editingMember, selectedMember, isOpen]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.birthDate && formData.deathDate) {
      const birth = new Date(formData.birthDate);
      const death = new Date(formData.deathDate);
      if (birth > death) {
        newErrors.deathDate = 'Death date cannot be before birth date';
      }
    }
    
    // Validate relationship if creating new member with relationship
    if (!editingMember && relationshipData.type && relationshipData.targetMember) {
      const tempMemberId = 'temp-id';
      const relData = relationshipData.direction === 'to' 
        ? { type: relationshipData.type, from: relationshipData.targetMember, to: tempMemberId }
        : { type: relationshipData.type, from: tempMemberId, to: relationshipData.targetMember };
      
      const validation = validateRelationship(relData, relationships);
      if (!validation.valid) {
        newErrors.relationship = validation.error || 'Invalid relationship';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (editingMember) {
      // Update existing member
      updateMember(editingMember.id, formData);
    } else {
      // Add new member
      const newMemberData = {
        ...formData,
        name: formData.name!,
        gender: formData.gender!,
      };
      
      // Create member first
      const memberId = crypto.randomUUID();
      addMember({ ...newMemberData, id: memberId } as any);
      
      // Add relationship if specified
      if (relationshipData.type && relationshipData.targetMember) {
        const relData = relationshipData.direction === 'to'
          ? { type: relationshipData.type, from: relationshipData.targetMember, to: memberId }
          : { type: relationshipData.type, from: memberId, to: relationshipData.targetMember };
        
        addRelationship(relData);
      }
    }
    
    onClose();
  };
  
  const handleInputChange = (field: keyof FamilyMember) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editingMember ? 'Edit Family Member' : 'Add Family Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <User className="w-4 h-4" />
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={handleInputChange('name')}
              className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          
          {/* Gender */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Users className="w-4 h-4" />
              Gender
            </label>
            <select
              value={formData.gender || 'other'}
              onChange={handleInputChange('gender')}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other/Prefer not to say</option>
            </select>
          </div>
          
          {/* Birth Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Calendar className="w-4 h-4" />
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birthDate || ''}
              onChange={handleInputChange('birthDate')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {/* Death Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Calendar className="w-4 h-4" />
              Death Date
            </label>
            <input
              type="date"
              value={formData.deathDate || ''}
              onChange={handleInputChange('deathDate')}
              className={`w-full p-2 border rounded-md ${errors.deathDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.deathDate && <p className="text-red-500 text-xs mt-1">{errors.deathDate}</p>}
          </div>
          
          {/* Photo URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Image className="w-4 h-4" />
              Photo URL
            </label>
            <input
              type="url"
              value={formData.photo || ''}
              onChange={handleInputChange('photo')}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="https://..."
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={handleInputChange('notes')}
              className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
              placeholder="Additional information..."
            />
          </div>
          
          {/* Relationship (only when adding new member) */}
          {!editingMember && members.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Add Relationship</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Relationship Type</label>
                  <select
                    value={relationshipData.type}
                    onChange={(e) => setRelationshipData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">None</option>
                    <option value="parent-child">Parent/Child</option>
                    <option value="spouse">Spouse/Partner</option>
                    <option value="sibling">Sibling</option>
                  </select>
                </div>
                
                {relationshipData.type && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Related To</label>
                      <select
                        value={relationshipData.targetMember}
                        onChange={(e) => setRelationshipData(prev => ({ ...prev, targetMember: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select member</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {relationshipData.type === 'parent-child' && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">This person is</label>
                        <select
                          value={relationshipData.direction}
                          onChange={(e) => setRelationshipData(prev => ({ ...prev, direction: e.target.value as 'to' | 'from' }))}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="to">Child of selected member</option>
                          <option value="from">Parent of selected member</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
                
                {errors.relationship && (
                  <p className="text-red-500 text-xs">{errors.relationship}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              {editingMember ? 'Update' : 'Add'} Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;