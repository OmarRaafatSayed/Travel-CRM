import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { HelpSystem } from './HelpSystem';
import { 
  Plus, Save, X, Menu, FileText, StickyNote, Link, Image, 
  Building2, Users, User, Target, Calendar, FileCheck,
  Lightbulb, Download, Upload, Briefcase, Trash2
} from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Override RTL styles for mind map
const mindMapStyles = `
  .react-flow {
    direction: ltr !important;
  }
  .react-flow * {
    direction: ltr !important;
    text-align: left !important;
  }
  .react-flow__node {
    direction: ltr !important;
    text-align: left !important;
    max-width: 300px;
    word-wrap: break-word;
  }
  .react-flow__node * {
    direction: ltr !important;
    text-align: left !important;
  }
  .react-flow__handle {
    direction: ltr !important;
  }
  .react-flow__controls {
    direction: ltr !important;
  }
  .react-flow__minimap {
    direction: ltr !important;
  }
  .react-flow__edge-text {
    direction: ltr !important;
    text-align: center !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('mindmap-ltr-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'mindmap-ltr-styles';
  styleElement.textContent = mindMapStyles;
  document.head.appendChild(styleElement);
}
import { EntityNode, StickyNoteNode, LinkNode, ImageNode, TextNode } from './MindMapNodes';

const nodeTypes: NodeTypes = {
  textNode: TextNode,
  entityNode: EntityNode,
  stickyNote: StickyNoteNode,
  linkNode: LinkNode,
  imageNode: ImageNode,
};

const CENTER_POSITION = { x: 0, y: 0 };

const initialNodes: Node[] = [
  {
    id: 'base-node',
    type: 'textNode',
    position: CENTER_POSITION,
    data: { 
      label: 'Central Idea',
      content: 'This is your main concept. Start building your mind map from here!',
      isEditable: true
    },
    draggable: false,
    selectable: true,
  },
];

const initialEdges: Edge[] = [];

function MindMapFlow() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { fitView, project, setCenter } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(true);
  const [mindMapTitle, setMindMapTitle] = useState('');
  const [mindMapDescription, setMindMapDescription] = useState('');
  const [currentMindMapId, setCurrentMindMapId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [savedMindMaps, setSavedMindMaps] = useState<any[]>([]);
  const [showSavedMaps, setShowSavedMaps] = useState(false);
  const [showSharedMaps, setShowSharedMaps] = useState(false);
  const [sharedMindMaps, setSharedMindMaps] = useState<any[]>([]);
  const [lastNodePosition, setLastNodePosition] = useState(CENTER_POSITION);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Center the base node on mount and load saved maps
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ nodes: [{ id: 'base-node' }], duration: 800 });
    }, 100);
    loadSavedMindMaps();
    loadCachedFlow();
    
    // Listen for delete events from nodes
    const handleDeleteNode = (event: any) => {
      deleteNode(event.detail.nodeId);
    };
    
    // Listen for node data updates
    const handleUpdateNodeData = (event: any) => {
      const { nodeId, data } = event.detail;
      setNodes((nds) => nds.map((node) => 
        node.id === nodeId ? { ...node, data } : node
      ));
    };
    
    window.addEventListener('deleteNode', handleDeleteNode);
    window.addEventListener('updateNodeData', handleUpdateNodeData);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('deleteNode', handleDeleteNode);
      window.removeEventListener('updateNodeData', handleUpdateNodeData);
    };
  }, [fitView]);

  // Auto-save to cache every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveToCacheIfChanged();
    }, 30000);
    return () => clearInterval(interval);
  }, [nodes, edges, mindMapTitle, mindMapDescription]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    const entityType = (event.target as HTMLElement).getAttribute('data-entity-type');
    if (entityType) {
      event.dataTransfer.setData('entity-type', entityType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const entityType = event.dataTransfer.getData('entity-type');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      // Place all new nodes at center point
      const position = CENTER_POSITION;

      let nodeData = {};
      switch (type) {
        case 'textNode':
          nodeData = { label: 'New Text', content: 'Enter your text here', isEditable: true };
          break;
        case 'stickyNote':
          nodeData = { content: 'New sticky note', color: '#fbbf24' };
          break;
        case 'linkNode':
          nodeData = { title: 'New Link', url: 'https://example.com', description: 'Link description' };
          break;
        case 'imageNode':
          nodeData = { title: 'New Image', url: '', description: 'Image description' };
          break;
        case 'entityNode':
          nodeData = { 
            entityType: entityType || 'leads', 
            entityId: '', 
            entityData: {},
            label: `${entityType || 'Entity'} Node`
          };
          break;
        default:
          nodeData = { label: 'New Node' };
      }

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: nodeData,
      };

      setLastNodePosition(position);
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const loadSavedMindMaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mindmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedMindMaps(data || []);
    } catch (error) {
      console.error('Error loading saved mind maps:', error);
    }
  };

  const loadSharedMindMaps = async () => {
    try {
      const { data, error } = await supabase
        .from('mindmaps')
        .select('*')
        .eq('shared_with_team', true)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSharedMindMaps(data || []);
      setShowSharedMaps(true);
    } catch (error) {
      console.error('Error loading shared mind maps:', error);
    }
  };

  const saveToCacheIfChanged = () => {
    const currentState = {
      title: mindMapTitle,
      description: mindMapDescription,
      nodes,
      edges,
      timestamp: Date.now()
    };
    
    const cached = localStorage.getItem('mindmap_cache');
    if (!cached || JSON.stringify(currentState) !== cached) {
      localStorage.setItem('mindmap_cache', JSON.stringify(currentState));
    }
  };

  const loadCachedFlow = () => {
    const cached = localStorage.getItem('mindmap_cache');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.nodes && data.nodes.length > 1) { // Only load if has more than base node
          setMindMapTitle(data.title || '');
          setMindMapDescription(data.description || '');
          setNodes(data.nodes);
          setEdges(data.edges || []);
        }
      } catch (error) {
        console.error('Error loading cached flow:', error);
      }
    }
  };

  const clearCache = () => {
    localStorage.removeItem('mindmap_cache');
    toast({
      title: t('common.success'),
      description: 'Cache cleared',
    });
  };

  const createNewMindMap = () => {
    setMindMapTitle('');
    setMindMapDescription('');
    setCurrentMindMapId(null);
    setNodes(initialNodes);
    setEdges(initialEdges);
    localStorage.removeItem('mindmap_cache');
    toast({
      title: t('common.success'),
      description: 'New mind map created',
    });
  };

  const loadSavedMindMap = (mindMap: any) => {
    setMindMapTitle(mindMap.name);
    setMindMapDescription(mindMap.description || '');
    setCurrentMindMapId(mindMap.id);
    setNodes(mindMap.nodes);
    setEdges(mindMap.edges || []);
    setShowSavedMaps(false);
    toast({
      title: t('common.success'),
      description: 'Mind map loaded',
    });
  };

  const deleteSavedMindMap = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Delete this mind map?')) return;
    
    try {
      const { error } = await supabase
        .from('mindmaps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSavedMindMaps();
      toast({
        title: t('common.success'),
        description: 'Mind map deleted',
      });
    } catch (error) {
      console.error('Error deleting mind map:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to delete mind map',
        variant: "destructive",
      });
    }
  };

  const shareWithTeam = async () => {
    if (!mindMapTitle.trim()) {
      toast({
        title: t('common.error'),
        description: 'Please add a title first',
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (currentMindMapId) {
        // Update existing mind map to share with team
        const { error } = await supabase
          .from('mindmaps')
          .update({ shared_with_team: true })
          .eq('id', currentMindMapId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Save first, then share
        await saveMindMap();
        if (currentMindMapId) {
          const { error } = await supabase
            .from('mindmaps')
            .update({ shared_with_team: true })
            .eq('id', currentMindMapId)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      }

      localStorage.removeItem('mindmap_cache');
      loadSavedMindMaps();
      toast({
        title: t('common.success'),
        description: 'Mind map shared with team',
      });
    } catch (error) {
      console.error('Error sharing mind map:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to share mind map',
        variant: "destructive",
      });
    }
  };

  const saveMindMap = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const mindMapData: any = {
        name: mindMapTitle || 'Untitled Mind Map',
        description: mindMapDescription,
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (currentMindMapId) {
        // Update existing mind map
        result = await supabase
          .from('mindmaps')
          .update(mindMapData)
          .eq('id', currentMindMapId)
          .eq('user_id', user.id);
      } else {
        // Create new mind map
        result = await supabase
          .from('mindmaps')
          .insert([mindMapData])
          .select('id')
          .single();
        
        if (result.data) {
          setCurrentMindMapId(result.data.id);
        }
      }

      if (result.error) throw result.error;

      localStorage.removeItem('mindmap_cache');
      loadSavedMindMaps();
      toast({
        title: t('common.success'),
        description: currentMindMapId ? 'Mind map updated' : t('mindMap.saved'),
      });
    } catch (error) {
      console.error('Error saving mind map:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save mind map',
        variant: "destructive",
      });
    }
  };

  const exportMindMap = () => {
    const data = {
      title: mindMapTitle,
      description: mindMapDescription,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mindMapTitle || 'mindmap'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNode(node);
    setIsDialogOpen(true);
  }, []);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    if (window.confirm('Delete this connection?')) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [setEdges]);

  const saveNodeEdit = () => {
    if (!editingNode) return;
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === editingNode.id ? editingNode : node
      )
    );
    setIsDialogOpen(false);
    setEditingNode(null);
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'base-node') return; // Prevent deleting base node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (node.id === 'base-node') return;
    
    const confirmDelete = window.confirm('Delete this node?');
    if (confirmDelete) {
      deleteNode(node.id);
    }
  }, []);

  return (
    <div className="h-full w-full bg-gray-50 relative" style={{ direction: 'ltr' }}>
      {/* Node Panel */}
      <div className={`absolute top-0 left-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-10 shadow-lg overflow-hidden ${
        isNodePanelOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: '280px', direction: 'rtl' }}>
        <div className="p-3 border-b border-gray-200 flex items-center justify-between" style={{ direction: 'rtl' }}>
          <h2 className="text-gray-900 font-semibold text-sm">{t('mindMap.title')}</h2>
          <Button
            onClick={() => setIsNodePanelOpen(false)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        <ScrollArea className="h-full pb-16">
          <div className="p-3 space-y-3" style={{ direction: 'rtl' }}>
            {/* Mind Map Management */}
            <div className="space-y-2">
              <Input
                placeholder={t('mindMap.titlePlaceholder')}
                value={mindMapTitle}
                onChange={(e) => setMindMapTitle(e.target.value)}
                className="bg-white border-gray-300 text-sm h-8"
              />
              <Textarea
                placeholder={t('mindMap.descriptionPlaceholder')}
                value={mindMapDescription}
                onChange={(e) => setMindMapDescription(e.target.value)}
                rows={2}
                className="bg-white border-gray-300 text-sm"
              />
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <Button onClick={saveMindMap} size="sm" className="text-xs h-7">
                    <Save className="w-3 h-3 mr-1" />
                    {currentMindMapId ? 'تحديث' : t('mindMap.save')}
                  </Button>
                  <Button onClick={createNewMindMap} variant="outline" size="sm" className="text-xs h-7">
                    <Plus className="w-3 h-3 mr-1" />
                    جديد
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-1">
                  <Button onClick={shareWithTeam} variant="outline" size="sm" className="text-xs h-7">
                    <Users className="w-3 h-3 mr-1" />
                    فريق
                  </Button>
                  <Button onClick={exportMindMap} variant="outline" size="sm" className="text-xs h-7">
                    <Download className="w-3 h-3 mr-1" />
                    تصدير
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    onClick={() => setShowSavedMaps(!showSavedMaps)} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                  >
                    <FileText className="w-3 h-3" />
                    ({savedMindMaps.length})
                  </Button>
                  <Button onClick={clearCache} variant="outline" size="sm" className="text-xs h-7">
                    <X className="w-3 h-3" />
                  </Button>
                  <Button onClick={loadSharedMindMaps} variant="outline" size="sm" className="text-xs h-7">
                    <Users className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            {/* Drag & Drop Nodes */}
            <div className="space-y-2">
              <h3 className="text-gray-900 font-medium text-xs">اسحب العقد</h3>
              
              <div className="grid grid-cols-2 gap-1">
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, 'textNode')}
                  className="p-2 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                >
                  <FileText className="w-4 h-4 text-blue-600 mb-1" />
                  <span className="text-xs text-gray-700">نص</span>
                </div>
                
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, 'stickyNote')}
                  className="p-2 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                >
                  <StickyNote className="w-4 h-4 text-yellow-600 mb-1" />
                  <span className="text-xs text-gray-700">ملاحظة</span>
                </div>
                
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, 'linkNode')}
                  className="p-2 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                >
                  <Link className="w-4 h-4 text-green-600 mb-1" />
                  <span className="text-xs text-gray-700">رابط</span>
                </div>
                
                <div
                  draggable
                  onDragStart={(e) => onDragStart(e, 'imageNode')}
                  className="p-2 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                >
                  <Image className="w-4 h-4 text-purple-600 mb-1" />
                  <span className="text-xs text-gray-700">صورة</span>
                </div>
              </div>
              
              {/* Entity Nodes */}
              <div className="space-y-1 mt-2">
                <h4 className="text-gray-900 font-medium text-xs">الكيانات</h4>
                <div className="grid grid-cols-3 gap-1">
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="leads"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <User className="w-3 h-3 text-blue-600 mb-1" />
                    <span className="text-xs text-gray-700">عملاء</span>
                  </div>
                  
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="deals"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <Target className="w-3 h-3 text-green-600 mb-1" />
                    <span className="text-xs text-gray-700">صفقات</span>
                  </div>
                  
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="projects"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <Briefcase className="w-3 h-3 text-purple-600 mb-1" />
                    <span className="text-xs text-gray-700">مشاريع</span>
                  </div>
                  
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="accounts"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <Building2 className="w-3 h-3 text-indigo-600 mb-1" />
                    <span className="text-xs text-gray-700">حسابات</span>
                  </div>
                  
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="invoices"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <FileCheck className="w-3 h-3 text-orange-600 mb-1" />
                    <span className="text-xs text-gray-700">فواتير</span>
                  </div>
                  
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'entityNode')}
                    data-entity-type="team"
                    className="p-1 bg-gray-50 rounded border border-gray-200 cursor-grab hover:bg-gray-100 transition-colors flex flex-col items-center text-center"
                  >
                    <Users className="w-3 h-3 text-cyan-600 mb-1" />
                    <span className="text-xs text-gray-700">فريق</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Saved Mind Maps Widget */}
            {showSavedMaps && (
              <div className="border-t border-gray-200 pt-2">
                <h4 className="text-gray-900 font-medium text-xs mb-2">الخرائط المحفوظة</h4>
                <div className="max-h-24 overflow-y-auto">
                  <div className="space-y-1">
                    {savedMindMaps.map((mindMap) => (
                      <div 
                        key={mindMap.id} 
                        className="p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                        onClick={() => loadSavedMindMap(mindMap)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate flex items-center gap-1">
                            {mindMap.name}
                            {mindMap.shared_with_team && <Users className="w-2 h-2 text-blue-500" />}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(mindMap.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          onClick={(e) => deleteSavedMindMap(mindMap.id, e)}
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                    {savedMindMaps.length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">لا توجد خرائط محفوظة</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Shared Mind Maps Widget */}
            {showSharedMaps && (
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-gray-900 font-medium text-xs">الخرائط المشتركة</h4>
                  <Button onClick={() => setShowSharedMaps(false)} variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <X className="w-2 h-2" />
                  </Button>
                </div>
                <div className="max-h-24 overflow-y-auto">
                  <div className="space-y-1">
                    {sharedMindMaps.map((mindMap) => (
                      <div 
                        key={mindMap.id} 
                        className="p-1 bg-blue-50 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => loadSavedMindMap(mindMap)}
                      >
                        <div className="text-xs font-medium text-gray-900 truncate flex items-center gap-1">
                          <Users className="w-2 h-2 text-blue-500" />
                          {mindMap.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(mindMap.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {sharedMindMaps.length === 0 && (
                      <div className="text-xs text-gray-500 text-center py-2">لا توجد خرائط مشتركة</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Toggle Panel Button */}
      {!isNodePanelOpen && (
        <Button
          onClick={() => setIsNodePanelOpen(true)}
          className="absolute top-4 left-4 z-20 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-md"
          size="sm"
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Main Canvas */}
      <div 
        ref={reactFlowWrapper} 
        className={`h-full transition-all duration-300 ${
          isNodePanelOpen ? 'ml-[280px]' : 'ml-0'
        }`}
        style={{ direction: 'ltr' }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView={false}
          defaultViewport={{ x: 0, y: 0, zoom: 0.1 }}
          minZoom={0.1}
          maxZoom={2}
          className="bg-gray-50"
          style={{ direction: 'ltr' }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
        >
          <Controls className="bg-white border-gray-300 shadow-md" />
          <MiniMap 
            className="bg-white border-gray-300 shadow-md" 
            nodeColor="#6366f1"
            maskColor="rgba(255, 255, 255, 0.8)"
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#d1d5db"
          />
          
          {/* Center Base Node Button */}
          <Panel position="top-right" className="m-4">
            <Button
              onClick={() => setCenter(lastNodePosition.x, lastNodePosition.y, { zoom: 0.1, duration: 800 })}
              className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-md"
              size="sm"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {t('mindMap.centerBase')}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Edit Node Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-300" style={{ direction: 'rtl' }}>
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('mindMap.editNode')}</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4" style={{ direction: 'rtl' }}>
              {editingNode.type === 'textNode' && (
                <>
                  <div>
                    <Label htmlFor="label" className="text-gray-700">{t('mindMap.label')}</Label>
                    <Input
                      id="label"
                      value={editingNode.data.label || ''}
                      onChange={(e) => setEditingNode({
                        ...editingNode,
                        data: { ...editingNode.data, label: e.target.value }
                      })}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-gray-700">{t('mindMap.content')}</Label>
                    <Textarea
                      id="content"
                      value={editingNode.data.content || ''}
                      onChange={(e) => setEditingNode({
                        ...editingNode,
                        data: { ...editingNode.data, content: e.target.value }
                      })}
                      rows={3}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </>
              )}
              
              {editingNode.type === 'stickyNote' && (
                <>
                  <div>
                    <Label htmlFor="content" className="text-gray-700">{t('mindMap.content')}</Label>
                    <Textarea
                      id="content"
                      value={editingNode.data.content || ''}
                      onChange={(e) => setEditingNode({
                        ...editingNode,
                        data: { ...editingNode.data, content: e.target.value }
                      })}
                      rows={3}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color" className="text-gray-700">{t('mindMap.color')}</Label>
                    <div className="flex gap-2 mt-2">
                      {['#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f97316'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            editingNode.data.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingNode({
                            ...editingNode,
                            data: { ...editingNode.data, color }
                          })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={saveNodeEdit}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MindMapManagement() {
  const { t } = useTranslation();
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mindMap.title')}</h1>
            <p className="text-gray-600 mt-1">{t('mindMap.description')}</p>
          </div>
          <HelpSystem feature="mindmap" />
        </div>
      </div>
      
      {/* Mind Map Canvas */}
      <div style={{ direction: 'ltr' }} className="flex-1">
        <ReactFlowProvider>
          <MindMapFlow />
        </ReactFlowProvider>
      </div>
    </div>
  );
}