import React, { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Plus, Settings, Search, Users, RotateCcw } from 'lucide-react';
import { useFamilyTreeStore } from './store';
import FamilyMemberNode from './FamilyMemberNode';
import AddMemberModal from './AddMemberModal';
import SettingsModal from './SettingsModal';
import { buildTreeStructure, calculateTreeLayout, searchMembers } from './utils';
import type { FamilyMember, PostMessageConfig } from './types';

const FamilyTreeWidget: React.FC = () => {
  const {
    members,
    relationships,
    settings,
    selectedMember,
    isAddingMember,
    isEditingMember,
    showSettings,
    searchQuery,
    setIsAddingMember,
    setIsEditingMember,
    setShowSettings,
    setSearchQuery,
    setSelectedMember,
    updateMember,
    handlePostMessage,
  } = useFamilyTreeStore();
  
  const transformRef = useRef<any>(null);
  const [draggedMember, setDraggedMember] = useState<FamilyMember | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [layoutedMembers, setLayoutedMembers] = useState<FamilyMember[]>([]);
  
  // Handle postMessage for iframe embedding
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const config: PostMessageConfig = event.data;
        if (config && (config.initialData || config.settings)) {
          handlePostMessage(config);
        }
      } catch (error) {
        console.warn('Invalid postMessage data:', error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePostMessage]);
  
  // Auto-layout calculation
  useEffect(() => {
    if (members.length === 0) {
      setLayoutedMembers([]);
      return;
    }
    
    // Build tree structure
    const trees = buildTreeStructure(members, relationships);
    const layoutedTrees = calculateTreeLayout(trees, settings);
    
    // Flatten back to members array with positions
    const updatedMembers = members.map(member => {
      // Find the member in the layouted trees
      const findInTree = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.id === member.id) return node;
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const layoutedMember = findInTree(layoutedTrees);
      if (layoutedMember && layoutedMember.x !== undefined && layoutedMember.y !== undefined) {
        return {
          ...member,
          x: layoutedMember.x,
          y: layoutedMember.y,
          generation: layoutedMember.generation,
        };
      }
      
      // Fallback positioning for members not in tree structure
      return {
        ...member,
        x: member.x || Math.random() * 400,
        y: member.y || Math.random() * 300,
      };
    });
    
    setLayoutedMembers(updatedMembers);
  }, [members, relationships, settings.nodeSpacing, settings.generationSpacing]);
  
  // Filter members based on search
  const filteredMembers = searchMembers(layoutedMembers, searchQuery);
  
  // Get currently editing member
  const editingMember = isEditingMember && selectedMember 
    ? members.find(m => m.id === selectedMember) 
    : null;
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, member: FamilyMember) => {
    setDraggedMember(member);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setDraggedMember(null);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedMember) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const transform = transformRef.current?.state;
    
    // Calculate position relative to the transform
    const scale = transform?.scale || 1;
    const offsetX = (transform?.positionX || 0) / scale;
    const offsetY = (transform?.positionY || 0) / scale;
    
    const x = (e.clientX - rect.left) / scale - offsetX;
    const y = (e.clientY - rect.top) / scale - offsetY;
    
    // Update member position
    updateMember(draggedMember.id, { x, y });
    setDraggedMember(null);
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Reset view
  const handleResetView = () => {
    transformRef.current?.resetTransform();
  };
  
  // Calculate canvas bounds
  const canvasBounds = React.useMemo(() => {
    if (layoutedMembers.length === 0) return { width: 800, height: 600 };
    
    const xs = layoutedMembers.map(m => m.x || 0);
    const ys = layoutedMembers.map(m => m.y || 0);
    
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 200;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 200;
    
    return {
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
      offsetX: minX,
      offsetY: minY,
    };
  }, [layoutedMembers]);
  
  // Render connections between family members
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    relationships.forEach(rel => {
      const fromMember = layoutedMembers.find(m => m.id === rel.from);
      const toMember = layoutedMembers.find(m => m.id === rel.to);
      
      if (!fromMember || !toMember) return;
      
      const fromX = (fromMember.x || 0) - (canvasBounds.offsetX || 0) + 96; // Center of node
      const fromY = (fromMember.y || 0) - (canvasBounds.offsetY || 0) + 50;
      const toX = (toMember.x || 0) - (canvasBounds.offsetX || 0) + 96;
      const toY = (toMember.y || 0) - (canvasBounds.offsetY || 0) + 50;
      
      let strokeColor = '#6b7280'; // gray
      let strokeWidth = 2;
      let strokeDasharray = '';
      
      switch (rel.type) {
        case 'parent-child':
          strokeColor = '#3b82f6'; // blue
          break;
        case 'spouse':
          strokeColor = '#ef4444'; // red
          strokeWidth = 3;
          break;
        case 'sibling':
          strokeColor = '#10b981'; // green
          strokeDasharray = '5,5';
          break;
      }
      
      connections.push(
        <line
          key={rel.id}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          opacity={0.7}
        />
      );
    });
    
    return connections;
  };
  
  return (
    <div className={`w-full h-screen ${settings.theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              Family Tree
            </h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search family members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetView}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsAddingMember(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Family Tree Canvas */}
      <div className="pt-20 h-full">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.8}
          minScale={0.1}
          maxScale={3}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.1 }}
          panning={{ velocityDisabled: true }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <div
              id="family-tree-canvas"
              className="relative"
              style={{
                width: canvasBounds.width,
                height: canvasBounds.height,
                minWidth: '100%',
                minHeight: '100%',
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => setSelectedMember(null)}
            >
              {/* Connection lines SVG */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvasBounds.width}
                height={canvasBounds.height}
              >
                {renderConnections()}
              </svg>
              
              {/* Family member nodes */}
              {filteredMembers.map(member => (
                <FamilyMemberNode
                  key={member.id}
                  member={{
                    ...member,
                    x: (member.x || 0) - (canvasBounds.offsetX || 0),
                    y: (member.y || 0) - (canvasBounds.offsetY || 0),
                  }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={isDragging && draggedMember?.id === member.id}
                />
              ))}
              
              {/* Empty state */}
              {members.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">No Family Members Yet</h2>
                    <p className="mb-4">Start building your family tree by adding the first member</p>
                    <button
                      onClick={() => setIsAddingMember(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                      Add First Member
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
      
      {/* Legend */}
      {relationships.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Parent-Child</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Spouse/Partner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500 border-dashed" style={{ borderTop: '2px dashed #10b981', background: 'none' }}></div>
              <span className="text-gray-700 dark:text-gray-300">Sibling</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <AddMemberModal
        isOpen={isAddingMember || isEditingMember}
        onClose={() => {
          setIsAddingMember(false);
          setIsEditingMember(false);
        }}
        editingMember={editingMember}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default FamilyTreeWidget;