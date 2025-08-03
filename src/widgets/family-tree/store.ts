import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyMember, Relationship, FamilyTreeData, TreeSettings, PostMessageConfig } from './types';

interface FamilyTreeStore {
  // Data
  members: FamilyMember[];
  relationships: Relationship[];
  settings: TreeSettings;
  
  // UI State
  selectedMember: string | null;
  isAddingMember: boolean;
  isEditingMember: boolean;
  showSettings: boolean;
  searchQuery: string;
  
  // Actions
  addMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  deleteRelationship: (id: string) => void;
  updateSettings: (settings: Partial<TreeSettings>) => void;
  
  // UI Actions
  setSelectedMember: (id: string | null) => void;
  setIsAddingMember: (adding: boolean) => void;
  setIsEditingMember: (editing: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Data management
  loadData: (data: FamilyTreeData) => void;
  exportData: () => FamilyTreeData;
  clearData: () => void;
  
  // PostMessage handling
  handlePostMessage: (config: PostMessageConfig) => void;
}

const defaultSettings: TreeSettings = {
  theme: 'light',
  showPhotos: true,
  showDates: true,
  showNotes: false,
  nodeSpacing: 200,
  generationSpacing: 150,
};

export const useFamilyTreeStore = create<FamilyTreeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      members: [],
      relationships: [],
      settings: defaultSettings,
      selectedMember: null,
      isAddingMember: false,
      isEditingMember: false,
      showSettings: false,
      searchQuery: '',
      
      // Member actions
      addMember: (memberData) => {
        const newMember: FamilyMember = {
          ...memberData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          members: [...state.members, newMember],
        }));
      },
      
      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          ),
        }));
      },
      
      deleteMember: (id) => {
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
          relationships: state.relationships.filter(
            (rel) => rel.from !== id && rel.to !== id
          ),
          selectedMember: state.selectedMember === id ? null : state.selectedMember,
        }));
      },
      
      // Relationship actions
      addRelationship: (relationshipData) => {
        const newRelationship: Relationship = {
          ...relationshipData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          relationships: [...state.relationships, newRelationship],
        }));
      },
      
      deleteRelationship: (id) => {
        set((state) => ({
          relationships: state.relationships.filter((rel) => rel.id !== id),
        }));
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      // UI actions
      setSelectedMember: (id) => set({ selectedMember: id }),
      setIsAddingMember: (adding) => set({ isAddingMember: adding }),
      setIsEditingMember: (editing) => set({ isEditingMember: editing }),
      setShowSettings: (show) => set({ showSettings: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Data management
      loadData: (data) => {
        set({
          members: data.members,
          relationships: data.relationships,
        });
      },
      
      exportData: () => {
        const { members, relationships } = get();
        return { members, relationships };
      },
      
      clearData: () => {
        set({
          members: [],
          relationships: [],
          selectedMember: null,
        });
      },
      
      // PostMessage handling
      handlePostMessage: (config) => {
        if (config.initialData) {
          get().loadData(config.initialData);
        }
        if (config.settings) {
          get().updateSettings(config.settings);
        }
      },
    }),
    {
      name: 'family-tree-storage',
      partialize: (state) => ({
        members: state.members,
        relationships: state.relationships,
        settings: state.settings,
      }),
    }
  )
);