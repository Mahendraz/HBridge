"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon, HeartIcon, FileIcon, UsersIcon, ImageIcon } from "lucide-react";

interface IChild {
  _id: string;
  name: string;
  dateOfBirth: string;
  diagnosis?: string;
  profile?: {
    avatar?: string;
    photos?: any[];
    documents?: any[];
    milestones?: any[];
    preferences?: {
      favoriteActivities?: string[];
      communicationStyle?: string;
    };
  };
  parentId: string;
  therapistId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChildProfileLayoutProps {
  child: IChild;
  activeTab: "overview" | "media" | "documents" | "milestones" | "family";
  onTabChange: (tab: "overview" | "media" | "documents" | "milestones" | "family") => void;
  children: ReactNode;
  canEdit?: boolean;
}

export function ChildProfileLayout({
  child,
  activeTab,
  onTabChange,
  children,
  canEdit = false
}: ChildProfileLayoutProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const tabItems = [
    { id: "overview", label: "Ikhtisar", icon: UserIcon },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "documents", label: "Dokumen", icon: FileIcon },
    { id: "milestones", label: "Pencapaian", icon: HeartIcon },
    { id: "family", label: "Keluarga", icon: UsersIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar size="xl">
                {child.profile?.avatar ? (
                  <AvatarImage src={child.profile.avatar} alt={child.name} />
                ) : (
                  <AvatarFallback className="bg-green-100 text-teal-700 text-lg font-semibold">
                    {getInitials(child.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <CardTitle className="text-2xl">{child.name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon size={16} />
                    <span>{calculateAge(child.dateOfBirth)} tahun</span>
                  </div>
                  {child.diagnosis && (
                    <Badge variant="secondary">{child.diagnosis}</Badge>
                  )}
                </div>
                
                {child.profile?.preferences?.favoriteActivities && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {child.profile.preferences.favoriteActivities.slice(0, 3).map((activity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                    {child.profile.preferences.favoriteActivities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{child.profile.preferences.favoriteActivities.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value: string) => onTabChange(value as "overview" | "media" | "documents" | "milestones" | "family")}>
        <TabsList className="grid w-full grid-cols-5">
          {tabItems.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <IconComponent size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}