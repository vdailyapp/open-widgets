// TypeScript interfaces for Family Tree Widget

interface FamilyMember {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  notes?: string;
  x?: number; // for custom positioning
  y?: number;
  generation?: number; // for automatic layout
}

interface Relationship {
  id: string;
  type: 'parent-child' | 'spouse' | 'sibling';
  from: string; // member ID
  to: string; // member ID
}

interface FamilyTreeData {
  members: FamilyMember[];
  relationships: Relationship[];
}

interface TreeSettings {
  theme: 'light' | 'dark';
  showPhotos: boolean;
  showDates: boolean;
  showNotes: boolean;
  nodeSpacing: number;
  generationSpacing: number;
}

interface TreeNode extends FamilyMember {
  children?: TreeNode[];
  spouse?: TreeNode;
  depth: number;
}

interface PostMessageConfig {
  initialData?: FamilyTreeData;
  settings?: Partial<TreeSettings>;
  readOnly?: boolean;
}

export type {
  FamilyMember,
  Relationship,
  FamilyTreeData,
  TreeSettings,
  TreeNode,
  PostMessageConfig
};