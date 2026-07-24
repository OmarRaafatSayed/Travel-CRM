import { Handle, Position } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Target, Briefcase, Building, FileText, Calendar,
  MessageSquare, StickyNote, Link, Image, Type, Trash2
} from "lucide-react";

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'leads': return <Users className="w-4 h-4" />;
    case 'deals': return <Target className="w-4 h-4" />;
    case 'projects': return <Briefcase className="w-4 h-4" />;
    case 'accounts': return <Building className="w-4 h-4" />;
    case 'invoices': return <FileText className="w-4 h-4" />;
    case 'content': return <Calendar className="w-4 h-4" />;
    case 'note': return <StickyNote className="w-4 h-4" />;
    case 'link': return <Link className="w-4 h-4" />;
    case 'image': return <Image className="w-4 h-4" />;
    case 'text': return <Type className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

export const EntityNode = ({ data, id }: any) => {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState(data.selectedEntityId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntities();
  }, [data.entityType]);

  const loadEntities = async () => {
    if (!data.entityType) return;
    setLoading(true);
    try {
      const { data: entityData } = await supabase
        .from(data.entityType)
        .select('*')
        .limit(50);
      setEntities(entityData || []);
    } catch (error) {
      console.error('Error loading entities:', error);
    }
    setLoading(false);
  };

  const getEntityName = (entity: any) => {
    return entity.name || entity.title || `${entity.first_name} ${entity.last_name}`.trim() || `${data.entityType} ${entity.id}`;
  };

  const selectedEntityData = entities.find(e => e.id === selectedEntity);

  return (
    <Card className="min-w-[200px] shadow-lg border-2 border-blue-200 relative" style={{ direction: 'ltr' }}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
      <Handle type="target" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
      
      <Button
        onClick={() => {
          if (window.confirm('Delete this node?')) {
            const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
            window.dispatchEvent(event);
          }
        }}
        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
        size="sm"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      
      <CardContent className="p-3" style={{ textAlign: 'left' }}>
        <div className="flex items-center gap-2 mb-2" style={{ flexDirection: 'row' }}>
          {getEntityIcon(data.entityType)}
          <Badge variant="outline">{data.entityType}</Badge>
        </div>
        
        <Select value={selectedEntity} onValueChange={(value) => {
          setSelectedEntity(value);
          const entityData = entities.find(e => e.id === value);
          // Update node data with selected entity
          const event = new CustomEvent('updateNodeData', { 
            detail: { 
              nodeId: id, 
              data: { 
                ...data, 
                selectedEntityId: value,
                selectedEntityData: entityData 
              } 
            } 
          });
          window.dispatchEvent(event);
        }} disabled={loading}>
          <SelectTrigger className="w-full mb-2">
            <SelectValue placeholder={loading ? 'Loading...' : `Select ${data.entityType}`} />
          </SelectTrigger>
          <SelectContent>
            {entities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{getEntityName(entity)}</span>
                  {entity.value && <span className="text-xs text-gray-500">${entity.value}</span>}
                  {entity.status && <span className="text-xs text-blue-500">{entity.status}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedEntityData && (
          <div className="mt-2 text-xs bg-muted p-2 rounded">
            <div className="font-medium">{getEntityName(selectedEntityData)}</div>
            {selectedEntityData.value && <div>Value: ${selectedEntityData.value}</div>}
            {selectedEntityData.status && <div>Status: {selectedEntityData.status}</div>}
            {selectedEntityData.email && <div>Email: {selectedEntityData.email}</div>}
          </div>
        )}
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
      <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    </Card>
  );
};

export const TextNode = ({ data, id }: any) => (
  <Card className="w-[250px] shadow-md border-2 border-gray-200 relative" style={{ direction: 'ltr' }}>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    
    {id !== 'base-node' && (
      <Button
        onClick={() => {
          if (window.confirm('حذف هذه العقدة؟')) {
            const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
            window.dispatchEvent(event);
          }
        }}
        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
        size="sm"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    )}
    
    <CardContent className="p-3" style={{ textAlign: 'left' }}>
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium break-words">{data.label}</span>
      </div>
      {data.content && (
        <div className="text-sm break-words">{data.content}</div>
      )}
    </CardContent>
    
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
  </Card>
);

export const StickyNoteNode = ({ data, id }: any) => (
  <div className="p-3 rounded-lg shadow-md min-w-[150px] max-w-[250px] relative" style={{ backgroundColor: data.color || '#fbbf24', direction: 'ltr' }}>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    
    <Button
      onClick={() => {
        if (window.confirm('Delete this node?')) {
          const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
          window.dispatchEvent(event);
        }
      }}
      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
      size="sm"
    >
      <Trash2 className="w-3 h-3" />
    </Button>
    
    <div className="text-sm font-medium mb-1" style={{ textAlign: 'left' }}>{data.label}</div>
    {data.content && (
      <div className="text-xs text-gray-700 whitespace-pre-wrap" style={{ textAlign: 'left' }}>{data.content}</div>
    )}
    
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
  </div>
);

export const LinkNode = ({ data, id }: any) => (
  <Card className="min-w-[180px] shadow-md border-2 border-green-200 relative" style={{ direction: 'ltr' }}>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    
    <Button
      onClick={() => {
        if (window.confirm('Delete this node?')) {
          const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
          window.dispatchEvent(event);
        }
      }}
      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
      size="sm"
    >
      <Trash2 className="w-3 h-3" />
    </Button>
    
    <CardContent className="p-3" style={{ textAlign: 'left' }}>
      <div className="flex items-center gap-2 mb-2" style={{ flexDirection: 'row' }}>
        <Link className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium">{data.title || data.label}</span>
      </div>
      {data.url && (
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline break-all"
        >
          {data.url}
        </a>
      )}
      {data.description && (
        <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
      )}
    </CardContent>
    
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
  </Card>
);

export const ImageNode = ({ data, id }: any) => (
  <Card className="min-w-[200px] shadow-md border-2 border-purple-200 relative" style={{ direction: 'ltr' }}>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    <Handle type="target" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-white !border-2" />
    
    <Button
      onClick={() => {
        if (window.confirm('Delete this node?')) {
          const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
          window.dispatchEvent(event);
        }
      }}
      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
      size="sm"
    >
      <Trash2 className="w-3 h-3" />
    </Button>
    
    <CardContent className="p-3" style={{ textAlign: 'left' }}>
      <div className="flex items-center gap-2 mb-2" style={{ flexDirection: 'row' }}>
        <Image className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium">{data.title || data.label}</span>
      </div>
      {data.url && (
        <img 
          src={data.url} 
          alt={data.title || data.label}
          className="w-full h-24 object-cover rounded mb-2"
          style={{ display: 'block', margin: '0 auto' }}
        />
      )}
      {data.description && (
        <div className="text-xs text-muted-foreground">{data.description}</div>
      )}
    </CardContent>
    
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Left} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-500 !border-white !border-2" />
  </Card>
);