"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  CircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  ImageIcon
} from "lucide-react";

interface IMilestone {
  _id: string;
  title: string;
  description: string;
  achievedDate?: string;
  targetDate?: string;
  category: "physical" | "cognitive" | "social" | "emotional" | "communication";
  status: "not-started" | "in-progress" | "achieved" | "deferred";
  notes: string;
  attachments: any[];
}

interface MilestoneTrackerProps {
  childId: string;
  milestones: IMilestone[];
  canEdit: boolean;
  onUpdateMilestone: (milestoneId: string, updates: Partial<IMilestone>) => Promise<void>;
  onCreateMilestone: (milestone: Omit<IMilestone, "_id">) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
}

const categoryColors = {
  physical: "bg-teal-100 text-teal-800",
  cognitive: "bg-purple-100 text-purple-800",
  social: "bg-green-100 text-green-800",
  emotional: "bg-yellow-100 text-yellow-800",
  communication: "bg-pink-100 text-pink-800"
} as const;

const statusIcons = {
  "not-started": CircleIcon,
  "in-progress": PlayCircleIcon,
  "achieved": CheckCircleIcon,
  "deferred": PauseCircleIcon
} as const;

const statusColors = {
  "not-started": "text-gray-400",
  "in-progress": "text-teal-500",
  "achieved": "text-green-500",
  "deferred": "text-yellow-500"
} as const;

export function MilestoneTracker({
  childId,
  milestones,
  canEdit,
  onUpdateMilestone,
  onCreateMilestone,
  onDeleteMilestone
}: MilestoneTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<IMilestone | null>(null);
  
  const { addToast } = useToast();

  const categories = ["all", "physical", "cognitive", "social", "emotional", "communication"];
  const statuses = ["all", "not-started", "in-progress", "achieved", "deferred"];

  const filteredMilestones = milestones.filter(milestone => {
    const categoryMatch = selectedCategory === "all" || milestone.category === selectedCategory;
    const statusMatch = selectedStatus === "all" || milestone.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const milestoneStats = {
    total: milestones.length,
    achieved: milestones.filter(m => m.status === "achieved").length,
    inProgress: milestones.filter(m => m.status === "in-progress").length,
    notStarted: milestones.filter(m => m.status === "not-started").length,
    deferred: milestones.filter(m => m.status === "deferred").length
  };

  const handleStatusChange = useCallback(async (milestoneId: string, newStatus: IMilestone["status"]) => {
    try {
      const updates: Partial<IMilestone> = { status: newStatus };
      if (newStatus === "achieved" && !milestones.find(m => m._id === milestoneId)?.achievedDate) {
        updates.achievedDate = new Date().toISOString();
      }
      
      await onUpdateMilestone(milestoneId, updates);
      addToast({
        title: "Milestone Updated",
        description: `Milestone status changed to ${newStatus.replace("-", " ")}.`,
        variant: "success"
      });
    } catch (error) {
      addToast({
        title: "Gagal Memperbarui",
        description: "Gagal memperbarui status pencapaian.",
        variant: "destructive"
      });
    }
  }, [milestones, onUpdateMilestone, addToast]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Belum diatur";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (targetDate?: string) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date() && new Date(targetDate).toDateString() !== new Date().toDateString();
  };

  const daysBetween = (date1: string, date2: string = new Date().toISOString()) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = d1.getTime() - d2.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{milestoneStats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{milestoneStats.achieved}</div>
            <div className="text-sm text-gray-600">Achieved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-500">{milestoneStats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-500">{milestoneStats.notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{milestoneStats.deferred}</div>
            <div className="text-sm text-gray-600">Deferred</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Milestones</h3>
          <p className="text-sm text-gray-600">
            {filteredMilestones.length} of {milestones.length} milestones
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === "all" ? "All Statuses" : status.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {canEdit && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon size={16} className="mr-2" />
              Add Milestone
            </Button>
          )}
        </div>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircleIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Milestones Found</h4>
            <p className="text-gray-500 mb-4">
              {selectedCategory !== "all" || selectedStatus !== "all" 
                ? "Try adjusting your filters to see more milestones."
                : "Start tracking progress by adding the first milestone."}
            </p>
            {canEdit && selectedCategory === "all" && selectedStatus === "all" && (
              <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
                <PlusIcon size={16} className="mr-2" />
                Add First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMilestones.map((milestone) => {
            const StatusIcon = statusIcons[milestone.status];
            const isLate = milestone.status !== "achieved" && isOverdue(milestone.targetDate);
            const daysUntilTarget = milestone.targetDate ? daysBetween(milestone.targetDate) : null;

            return (
              <Card key={milestone._id} className={`${isLate ? "border-red-200 bg-red-50" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <StatusIcon 
                          size={20} 
                          className={statusColors[milestone.status]}
                        />
                        <h4 className="font-semibold text-lg">{milestone.title}</h4>
                        <Badge className={categoryColors[milestone.category]}>
                          {milestone.category}
                        </Badge>
                        {isLate && (
                          <Badge variant="destructive">Terlambat</Badge>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4">{milestone.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={16} className="text-gray-500" />
                          <span>Target: {formatDate(milestone.targetDate)}</span>
                          {daysUntilTarget !== null && milestone.status !== "achieved" && (
                            <span className={`ml-2 ${daysUntilTarget < 0 ? "text-red-600" : daysUntilTarget <= 7 ? "text-yellow-600" : "text-gray-500"}`}>
                              ({daysUntilTarget < 0 ? `${Math.abs(daysUntilTarget)} hari terlambat` :
                                daysUntilTarget === 0 ? "Hari ini" :
                                `${daysUntilTarget} hari lagi`})
                            </span>
                          )}
                        </div>
                        
                        {milestone.achievedDate && (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon size={16} className="text-green-500" />
                            <span>Achieved: {formatDate(milestone.achievedDate)}</span>
                          </div>
                        )}
                      </div>

                      {milestone.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileTextIcon size={16} className="text-gray-500" />
                            <span className="font-medium text-sm">Notes</span>
                          </div>
                          <p className="text-sm text-gray-700">{milestone.notes}</p>
                        </div>
                      )}

                      {milestone.attachments.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon size={16} className="text-gray-500" />
                            <span className="font-medium text-sm">
                              {milestone.attachments.length} attachment{milestone.attachments.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {/* Attachment previews would go here */}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {canEdit && (
                        <>
                          <select
                            value={milestone.status}
                            onChange={(e) => handleStatusChange(milestone._id, e.target.value as IMilestone["status"])}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[120px]"
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="achieved">Achieved</option>
                            <option value="deferred">Deferred</option>
                          </select>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMilestone(milestone)}
                            >
                              <EditIcon size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteMilestone(milestone._id)}
                            >
                              <TrashIcon size={16} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Milestone Dialog */}
      <MilestoneDialog
        open={createDialogOpen || !!editingMilestone}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingMilestone(null);
          }
        }}
        milestone={editingMilestone}
        onSave={async (milestoneData) => {
          try {
            if (editingMilestone) {
              await onUpdateMilestone(editingMilestone._id, milestoneData);
              addToast({
                title: "Pencapaian Diperbarui",
                description: "Pencapaian berhasil diperbarui.",
                variant: "success"
              });
            } else {
              await onCreateMilestone(milestoneData as Omit<IMilestone, "_id">);
              addToast({
                title: "Pencapaian Dibuat",
                description: "Pencapaian baru berhasil ditambahkan.",
                variant: "success"
              });
            }
            setCreateDialogOpen(false);
            setEditingMilestone(null);
          } catch (error) {
            addToast({
              title: "Gagal Menyimpan",
              description: "Gagal menyimpan pencapaian. Silakan coba lagi.",
              variant: "destructive"
            });
          }
        }}
      />
    </div>
  );
}

// Milestone Create/Edit Dialog
function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: IMilestone | null;
  onSave: (milestone: Partial<IMilestone>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: milestone?.title || "",
    description: milestone?.description || "",
    category: milestone?.category || "physical" as const,
    targetDate: milestone?.targetDate ? milestone.targetDate.split("T")[0] : "",
    notes: milestone?.notes || "",
    status: milestone?.status || "not-started" as const
  });

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    const milestoneData: Partial<IMilestone> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : undefined,
      notes: formData.notes.trim(),
      status: formData.status
    };

    await onSave(milestoneData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Edit Pencapaian" : "Buat Pencapaian Baru"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Judul *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul pencapaian..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsikan pencapaian ini..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as IMilestone["category"] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="physical">Fisik</option>
                <option value="cognitive">Kognitif</option>
                <option value="social">Sosial</option>
                <option value="emotional">Emosional</option>
                <option value="communication">Komunikasi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as IMilestone["status"] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="not-started">Belum Dimulai</option>
                <option value="in-progress">Sedang Berjalan</option>
                <option value="achieved">Tercapai</option>
                <option value="deferred">Ditunda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Target</label>
            <DatePicker
              value={formData.targetDate}
              onChange={(val) => setFormData(prev => ({ ...prev, targetDate: val }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan atau observasi tambahan..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            {milestone ? "Perbarui" : "Buat"} Pencapaian
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}