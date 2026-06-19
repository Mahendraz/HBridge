"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  PlusIcon,
  EditIcon,
  UserIcon,
  HeartIcon,
  UsersIcon,
  InfoIcon
} from "lucide-react";

interface IFamilyMember {
  userId?: string;
  name: string;
  relationship: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  role: "caregiver" | "emergency-contact" | "family" | "support";
  permissions: string[];
  isActive: boolean;
  invitedAt?: string;
  joinedAt?: string;
}

interface IFamilyTreeNode {
  memberId: string;
  name: string;
  relationship: string;
  generation: number;
  parentIds: string[];
  avatar?: string;
  isDeceased: boolean;
  birthYear?: number;
  notes?: string;
  position?: { x: number; y: number };
}

interface IFamily {
  _id: string;
  familyName: string;
  primaryParents: string[];
  children: string[];
  extendedMembers: IFamilyMember[];
  familyTree: IFamilyTreeNode[];
  settings: {
    visibility: "private" | "therapist-visible" | "public";
    allowMemberInvites: boolean;
    requireApproval: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface FamilyTreeVisualizationProps {
  family: IFamily;
  canEdit: boolean;
  onAddMember: (member: Omit<IFamilyMember, "isActive" | "invitedAt">) => Promise<void>;
  onEditMember: (memberId: string, updates: Partial<IFamilyMember>) => Promise<void>;
  onUpdateTreeLayout: (treeData: IFamilyTreeNode[]) => Promise<void>;
}

export function FamilyTreeVisualization({
  family,
  canEdit,
  onAddMember,
  onEditMember,
  onUpdateTreeLayout
}: FamilyTreeVisualizationProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<IFamilyTreeNode | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragStart: { x: number; y: number };
    nodeStart?: { x: number; y: number };
    draggedNode?: string;
  }>({ isDragging: false, dragStart: { x: 0, y: 0 } });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Calculate layout for family tree nodes
  const calculateNodeLayout = useCallback((nodes: IFamilyTreeNode[]) => {
    const generations = new Map<number, IFamilyTreeNode[]>();
    
    // Group nodes by generation
    nodes.forEach(node => {
      if (!generations.has(node.generation)) {
        generations.set(node.generation, []);
      }
      generations.get(node.generation)!.push(node);
    });

    const nodeWidth = 120;
    const nodeHeight = 80;
    const horizontalSpacing = 180;
    const verticalSpacing = 120;
    
    const layoutNodes: IFamilyTreeNode[] = [];

    generations.forEach((generationNodes, generation) => {
      const totalWidth = (generationNodes.length - 1) * horizontalSpacing;
      const startX = -totalWidth / 2;
      
      generationNodes.forEach((node, index) => {
        layoutNodes.push({
          ...node,
          position: {
            x: startX + (index * horizontalSpacing),
            y: generation * verticalSpacing
          }
        });
      });
    });

    return layoutNodes;
  }, []);

  const [layoutNodes, setLayoutNodes] = useState(() => 
    calculateNodeLayout(family.familyTree)
  );

  useEffect(() => {
    setLayoutNodes(calculateNodeLayout(family.familyTree));
  }, [family.familyTree, calculateNodeLayout]);

  // Zoom functions
  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse event handlers for panning and node dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale - position.x;
    const y = (e.clientY - rect.top) / scale - position.y;

    // Check if clicking on a node
    const clickedNode = layoutNodes.find(node => {
      const nodeX = node.position?.x || 0;
      const nodeY = node.position?.y || 0;
      return x >= nodeX - 60 && x <= nodeX + 60 && y >= nodeY - 40 && y <= nodeY + 40;
    });

    if (clickedNode && canEdit) {
      setDragState({
        isDragging: true,
        dragStart: { x: e.clientX, y: e.clientY },
        nodeStart: clickedNode.position,
        draggedNode: clickedNode.memberId
      });
    } else {
      setDragState({
        isDragging: true,
        dragStart: { x: e.clientX, y: e.clientY }
      });
    }
  }, [layoutNodes, scale, position, canEdit]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.isDragging) return;

    if (dragState.draggedNode && dragState.nodeStart) {
      // Dragging a node
      const dx = (e.clientX - dragState.dragStart.x) / scale;
      const dy = (e.clientY - dragState.dragStart.y) / scale;
      
      setLayoutNodes(prev => prev.map(node =>
        node.memberId === dragState.draggedNode
          ? {
              ...node,
              position: {
                x: dragState.nodeStart!.x + dx,
                y: dragState.nodeStart!.y + dy
              }
            }
          : node
      ));
    } else {
      // Panning the view
      const dx = e.clientX - dragState.dragStart.x;
      const dy = e.clientY - dragState.dragStart.y;
      setPosition(prev => ({
        x: prev.x + dx / scale,
        y: prev.y + dy / scale
      }));
      setDragState(prev => ({
        ...prev,
        dragStart: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [dragState, scale]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.draggedNode) {
      // Save the updated layout
      onUpdateTreeLayout(layoutNodes);
    }
    setDragState({ isDragging: false, dragStart: { x: 0, y: 0 } });
  }, [dragState, layoutNodes, onUpdateTreeLayout]);

  const handleNodeClick = useCallback((node: IFamilyTreeNode) => {
    if (!dragState.isDragging) {
      setSelectedNode(node);
      setShowMemberDialog(true);
    }
  }, [dragState.isDragging]);

  // Generate connections between nodes
  const generateConnections = useCallback(() => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; type: string }> = [];
    
    layoutNodes.forEach(node => {
      node.parentIds.forEach(parentId => {
        const parent = layoutNodes.find(n => n.memberId === parentId);
        if (parent && parent.position && node.position) {
          connections.push({
            from: { x: parent.position.x, y: parent.position.y + 40 },
            to: { x: node.position.x, y: node.position.y - 40 },
            type: 'parent'
          });
        }
      });
    });

    return connections;
  }, [layoutNodes]);

  const connections = generateConnections();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelationshipColor = (relationship: string) => {
    const relationshipColors: { [key: string]: string } = {
      'parent': 'bg-green-100 text-green-800',
      'child': 'bg-green-100 text-green-800',
      'sibling': 'bg-purple-100 text-purple-800',
      'grandparent': 'bg-yellow-100 text-yellow-800',
      'grandchild': 'bg-pink-100 text-pink-800',
      'aunt': 'bg-teal-100 text-teal-800',
      'uncle': 'bg-teal-100 text-teal-800',
      'cousin': 'bg-gray-100 text-gray-800',
      'spouse': 'bg-red-100 text-red-800'
    };
    return relationshipColors[relationship.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon size={24} />
                {family.familyName} Family Tree
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {layoutNodes.length} family member{layoutNodes.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {canEdit && (
              <Button onClick={() => setShowMemberDialog(true)}>
                <PlusIcon size={16} className="mr-2" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomInIcon size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOutIcon size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcwIcon size={16} />
              </Button>
              <span className="text-sm text-gray-600 ml-2">
                Zoom: {Math.round(scale * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-teal-200 rounded-full"></div>
                <span>Parents</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                <span>Children</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-200 rounded-full"></div>
                <span>Siblings</span>
              </div>
              {canEdit && (
                <span className="text-xs italic">Drag nodes to rearrange</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Tree Visualization */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={containerRef}
            className="relative w-full h-[600px] overflow-hidden bg-gray-50"
          >
            <svg
              ref={svgRef}
              className="w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <g transform={`translate(${position.x + 400}, ${position.y + 100}) scale(${scale})`}>
                {/* Connection lines */}
                {connections.map((conn, index) => (
                  <g key={index}>
                    <line
                      x1={conn.from.x}
                      y1={conn.from.y}
                      x2={conn.to.x}
                      y2={conn.to.y}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray={conn.type === 'parent' ? "0" : "5,5"}
                    />
                    {/* Arrow marker */}
                    <polygon
                      points={`${conn.to.x},${conn.to.y} ${conn.to.x-5},${conn.to.y-8} ${conn.to.x+5},${conn.to.y-8}`}
                      fill="#94a3b8"
                    />
                  </g>
                ))}
                
                {/* Family tree nodes */}
                {layoutNodes.map((node) => (
                  <g
                    key={node.memberId}
                    transform={`translate(${node.position?.x || 0}, ${node.position?.y || 0})`}
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(node)}
                  >
                    {/* Node background */}
                    <rect
                      x="-60"
                      y="-40"
                      width="120"
                      height="80"
                      rx="8"
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth="2"
                      className="hover:stroke-teal-400 transition-colors"
                    />
                    
                    {/* Avatar circle */}
                    <circle
                      cx="0"
                      cy="-15"
                      r="15"
                      fill="#f1f5f9"
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                    
                    {/* Avatar image or initials */}
                    {node.avatar ? (
                      <image
                        x="-15"
                        y="-30"
                        width="30"
                        height="30"
                        href={node.avatar}
                        clipPath="circle(15px at 50% 50%)"
                      />
                    ) : (
                      <text
                        x="0"
                        y="-10"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        fontWeight="semibold"
                      >
                        {getInitials(node.name)}
                      </text>
                    )}
                    
                    {/* Name */}
                    <text
                      x="0"
                      y="8"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#1f2937"
                      fontWeight="semibold"
                    >
                      {node.name.length > 15 ? `${node.name.slice(0, 12)}...` : node.name}
                    </text>
                    
                    {/* Relationship */}
                    <text
                      x="0"
                      y="22"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                    >
                      {node.relationship}
                    </text>
                    
                    {/* Birth year */}
                    {node.birthYear && (
                      <text
                        x="0"
                        y="35"
                        textAnchor="middle"
                        fontSize="8"
                        fill="#9ca3af"
                      >
                        b. {node.birthYear}
                      </text>
                    )}
                    
                    {/* Deceased indicator */}
                    {node.isDeceased && (
                      <text
                        x="45"
                        y="-25"
                        fontSize="12"
                        fill="#ef4444"
                      >
                        †
                      </text>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-gray-500" />
              <span>Click to view details</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartIcon size={16} className="text-red-500" />
              <span>† = Deceased</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400"></div>
              <span>Family connection</span>
            </div>
            <div className="flex items-center gap-2">
              <InfoIcon size={16} className="text-teal-500" />
              <span>Zoom and pan to navigate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Details/Add Dialog */}
      <MemberDialog
        open={showMemberDialog}
        onOpenChange={setShowMemberDialog}
        member={selectedNode}
        family={family}
        canEdit={canEdit}
        onSave={async (memberData) => {
          try {
            if (selectedNode) {
              await onEditMember(selectedNode.memberId, memberData);
              addToast({
                title: "Anggota Diperbarui",
                description: "Detail anggota keluarga berhasil diperbarui.",
                variant: "success"
              });
            } else {
              await onAddMember(memberData as Omit<IFamilyMember, "isActive" | "invitedAt">);
              addToast({
                title: "Anggota Ditambahkan",
                description: "Anggota keluarga baru berhasil ditambahkan ke pohon keluarga.",
                variant: "success"
              });
            }
            setShowMemberDialog(false);
            setSelectedNode(null);
          } catch (error) {
            addToast({
              title: "Gagal Menyimpan",
              description: "Gagal menyimpan detail anggota keluarga.",
              variant: "destructive"
            });
          }
        }}
      />
    </div>
  );
}

// Member Details/Add Dialog Component
function MemberDialog({
  open,
  onOpenChange,
  member,
  family,
  canEdit,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: IFamilyTreeNode | null;
  family: IFamily;
  canEdit: boolean;
  onSave: (memberData: Partial<IFamilyMember>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    role: "family" as IFamilyMember["role"],
    email: "",
    phone: "",
    birthYear: "",
    notes: "",
    isDeceased: false
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        relationship: member.relationship || "",
        role: "family",
        email: "",
        phone: "",
        birthYear: member.birthYear?.toString() || "",
        notes: member.notes || "",
        isDeceased: member.isDeceased || false
      });
    } else {
      setFormData({
        name: "",
        relationship: "",
        role: "family",
        email: "",
        phone: "",
        birthYear: "",
        notes: "",
        isDeceased: false
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.relationship.trim()) return;

    const memberData: Partial<IFamilyMember> = {
      name: formData.name.trim(),
      relationship: formData.relationship.trim(),
      role: formData.role,
      contactInfo: {
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined
      },
      permissions: []
    };

    await onSave(memberData);
  };

  const relationshipOptions = [
    "parent", "child", "sibling", "grandparent", "grandchild",
    "aunt", "uncle", "cousin", "spouse", "partner", "step-parent",
    "step-child", "step-sibling", "guardian", "other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {member ? "Detail Anggota Keluarga" : "Tambah Anggota Keluarga"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {member && !canEdit ? (
            // View-only mode
            <div className="space-y-4">
              <div className="text-center">
                <Avatar size="xl" className="mx-auto mb-4">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={member.name} />
                  ) : (
                    <AvatarFallback className="bg-green-100 text-teal-700 text-xl">
                      {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <Badge className={`mt-2 ${getRelationshipColor(member.relationship)}`}>
                  {member.relationship}
                </Badge>
                {member.isDeceased && (
                  <Badge variant="secondary" className="ml-2">Deceased</Badge>
                )}
              </div>

              {member.birthYear && (
                <div>
                  <span className="font-medium">Born:</span> {member.birthYear}
                </div>
              )}

              {member.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="mt-1 text-gray-700">{member.notes}</p>
                </div>
              )}
            </div>
          ) : (
            // Edit mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Relationship *</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select relationship</option>
                    {relationshipOptions.map(rel => (
                      <option key={rel} value={rel}>
                        {rel.charAt(0).toUpperCase() + rel.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Nomor telepon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Birth Year</label>
                  <input
                    type="number"
                    value={formData.birthYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as IFamilyMember["role"] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="family">Family Member</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="emergency-contact">Emergency Contact</option>
                    <option value="support">Support Person</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isDeceased}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDeceased: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Deceased</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Catatan tambahan tentang anggota keluarga ini..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {member && !canEdit ? "Tutup" : "Batal"}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.relationship.trim()}
            >
              {member ? "Perbarui" : "Tambah"} Anggota
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility function for relationship colors (moved outside component to avoid re-creation)
function getRelationshipColor(relationship: string) {
  const relationshipColors: { [key: string]: string } = {
    'parent': 'bg-green-100 text-green-800',
    'child': 'bg-green-100 text-green-800',
    'sibling': 'bg-purple-100 text-purple-800',
    'grandparent': 'bg-yellow-100 text-yellow-800',
    'grandchild': 'bg-pink-100 text-pink-800',
    'aunt': 'bg-teal-100 text-teal-800',
    'uncle': 'bg-teal-100 text-teal-800',
    'cousin': 'bg-gray-100 text-gray-800',
    'spouse': 'bg-red-100 text-red-800'
  };
  return relationshipColors[relationship.toLowerCase()] || 'bg-gray-100 text-gray-800';
}