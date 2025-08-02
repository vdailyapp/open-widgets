import type { FamilyMember, Relationship, TreeNode } from './types';
import * as d3 from 'd3';

// Generate a unique ID
export const generateId = (): string => crypto.randomUUID();

// Build tree structure from flat data
export const buildTreeStructure = (
  members: FamilyMember[],
  relationships: Relationship[]
): TreeNode[] => {
  const memberMap = new Map(members.map(m => [m.id, { ...m, children: [], depth: 0 }]));
  const roots: TreeNode[] = [];
  
  // Find parent-child relationships
  const parentChildRels = relationships.filter(r => r.type === 'parent-child');
  const spouseRels = relationships.filter(r => r.type === 'spouse');
  
  // Process parent-child relationships
  parentChildRels.forEach(rel => {
    const parent = memberMap.get(rel.from);
    const child = memberMap.get(rel.to);
    if (parent && child) {
      parent.children = parent.children || [];
      parent.children.push(child);
      child.depth = (parent.depth || 0) + 1;
    }
  });
  
  // Process spouse relationships
  spouseRels.forEach(rel => {
    const member1 = memberMap.get(rel.from);
    const member2 = memberMap.get(rel.to);
    if (member1 && member2) {
      member1.spouse = member2;
      member2.spouse = member1;
    }
  });
  
  // Find root nodes (those without parents)
  const childIds = new Set(parentChildRels.map(r => r.to));
  memberMap.forEach((member, id) => {
    if (!childIds.has(id)) {
      roots.push(member);
    }
  });
  
  return roots;
};

// Auto-layout tree using D3 hierarchy
export const calculateTreeLayout = (
  roots: TreeNode[],
  settings: { nodeSpacing: number; generationSpacing: number }
): TreeNode[] => {
  if (roots.length === 0) return [];
  
  const layoutRoots: TreeNode[] = [];
  let currentX = 0;
  
  roots.forEach(root => {
    // Create D3 hierarchy
    const hierarchy = d3.hierarchy(root, d => d.children);
    
    // Create tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([400, 300])
      .separation(() => 1);
    
    const tree = treeLayout(hierarchy);
    
    // Apply positions
    tree.descendants().forEach(node => {
      if (node.data) {
        node.data.x = (node.x || 0) + currentX;
        node.data.y = (node.y || 0) * settings.generationSpacing / 100;
        node.data.generation = node.depth;
      }
    });
    
    // Update currentX for next tree
    const treeWidth = Math.max(...tree.descendants().map(n => n.x || 0)) + settings.nodeSpacing;
    currentX += treeWidth;
    
    layoutRoots.push(root);
  });
  
  return layoutRoots;
};

// Search functionality
export const searchMembers = (
  members: FamilyMember[],
  query: string
): FamilyMember[] => {
  if (!query.trim()) return members;
  
  const lowercaseQuery = query.toLowerCase();
  return members.filter(member =>
    member.name.toLowerCase().includes(lowercaseQuery) ||
    member.notes?.toLowerCase().includes(lowercaseQuery) ||
    member.birthDate?.includes(query) ||
    member.deathDate?.includes(query)
  );
};

// Export to JSON
export const exportToJSON = (members: FamilyMember[], relationships: Relationship[]): string => {
  return JSON.stringify({ members, relationships }, null, 2);
};

// Export to SVG
export const exportToSVG = (svgElement: SVGSVGElement): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
};

// Validate relationship (prevent cycles, etc.)
export const validateRelationship = (
  relationship: Omit<Relationship, 'id'>,
  existingRelationships: Relationship[]
): { valid: boolean; error?: string } => {
  const { type, from, to } = relationship;
  
  // Check for self-relationship
  if (from === to) {
    return { valid: false, error: 'Cannot create relationship with self' };
  }
  
  // Check for duplicate relationships
  const duplicate = existingRelationships.find(
    r => r.from === from && r.to === to && r.type === type
  );
  if (duplicate) {
    return { valid: false, error: 'Relationship already exists' };
  }
  
  // For parent-child, check for cycles
  if (type === 'parent-child') {
    const wouldCreateCycle = checkForCycle(from, to, existingRelationships);
    if (wouldCreateCycle) {
      return { valid: false, error: 'Would create a cycle in family tree' };
    }
  }
  
  return { valid: true };
};

// Check for cycles in parent-child relationships
const checkForCycle = (
  parentId: string,
  childId: string,
  relationships: Relationship[]
): boolean => {
  const visited = new Set<string>();
  const queue = [childId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    
    if (current === parentId) return true;
    
    visited.add(current);
    
    // Find children of current node
    const children = relationships
      .filter(r => r.type === 'parent-child' && r.from === current)
      .map(r => r.to);
    
    queue.push(...children);
  }
  
  return false;
};

// Format date for display
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

// Calculate age
export const calculateAge = (birthDate?: string, deathDate?: string): string => {
  if (!birthDate) return '';
  
  try {
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const ageInMs = end.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
    
    if (deathDate) {
      return `${ageInYears} years`;
    } else {
      return `${ageInYears} years old`;
    }
  } catch {
    return '';
  }
};