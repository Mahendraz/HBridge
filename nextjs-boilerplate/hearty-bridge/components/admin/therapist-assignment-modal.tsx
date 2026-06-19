"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  UserCheckIcon,
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  XIcon,
  StarIcon,
  BrainIcon,
  SparklesIcon
} from "lucide-react";
import { AssignmentEngine, type Patient as EnginePatient, type Therapist as EngineTherapist } from "@/lib/utils/assignment-engine";

interface Patient {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
  parentId: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTherapist?: {
    _id: string;
    name: string;
    email: string;
  };
  medicalInfo: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
}

interface Therapist {
  _id: string;
  name: string;
  email: string;
  profile?: {
    specializations?: string[];
    yearsOfExperience?: number;
    licenseNumber?: string;
  };
  isActive: boolean;
  assignedPatientsCount?: number;
}

interface TherapistAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onAssign: (patientId: string, therapistId: string) => Promise<void>;
}

export function TherapistAssignmentModal({ 
  isOpen, 
  onClose, 
  patient, 
  onAssign 
}: TherapistAssignmentModalProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [filterSpecialization, setFilterSpecialization] = useState<string>("");
  const [useSmartMatching, setUseSmartMatching] = useState(true);
  const [assignmentEngine] = useState(new AssignmentEngine());

  useEffect(() => {
    if (isOpen) {
      loadTherapists();
    }
  }, [isOpen]);

  const loadTherapists = async () => {
    try {
      setIsLoading(true);
      
      // Mock therapist data - in real implementation, this would fetch from API
      const mockTherapists: Therapist[] = [
        {
          _id: "therapist1",
          name: "Dr. Sarah Johnson",
          email: "sarah.johnson@heartybridge.com",
          profile: {
            specializations: ["Autism Spectrum Therapy", "Behavioral Therapy"],
            yearsOfExperience: 8,
            licenseNumber: "LIC123456"
          },
          isActive: true,
          assignedPatientsCount: 12
        },
        {
          _id: "therapist2",
          name: "Dr. Michael Chen",
          email: "michael.chen@heartybridge.com",
          profile: {
            specializations: ["Speech Therapy", "Language Development"],
            yearsOfExperience: 12,
            licenseNumber: "LIC789012"
          },
          isActive: true,
          assignedPatientsCount: 8
        },
        {
          _id: "therapist3",
          name: "Dr. Emma Williams",
          email: "emma.williams@heartybridge.com",
          profile: {
            specializations: ["Occupational Therapy", "Sensory Integration"],
            yearsOfExperience: 5,
            licenseNumber: "LIC345678"
          },
          isActive: true,
          assignedPatientsCount: 15
        },
        {
          _id: "therapist4",
          name: "Dr. James Rodriguez",
          email: "james.rodriguez@heartybridge.com",
          profile: {
            specializations: ["Physical Therapy", "Motor Skills Development"],
            yearsOfExperience: 6,
            licenseNumber: "LIC456789"
          },
          isActive: true,
          assignedPatientsCount: 5
        }
      ];

      setTherapists(mockTherapists);
    } catch (error) {
      console.error("Failed to load therapists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTherapist || !patient) return;

    setIsAssigning(true);
    try {
      await onAssign(patient._id, selectedTherapist);
      onClose();
      setSelectedTherapist("");
    } catch (error) {
      console.error("Failed to assign therapist:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getSpecializations = () => {
    const allSpecs = new Set<string>();
    therapists.forEach(therapist => {
      therapist.profile?.specializations?.forEach(spec => allSpecs.add(spec));
    });
    return Array.from(allSpecs);
  };

  // Transform data for assignment engine
  const transformPatientForEngine = (patient: Patient): EnginePatient => ({
    _id: patient._id,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    medicalInfo: {
      ...patient.medicalInfo,
      notes: ""
    },
    parentId: patient.parentId,
    priority: "normal",
    preferences: {
      therapistGender: "no-preference",
      sessionTime: "no-preference",
      maxTravelDistance: 25,
      languagePreference: ["English"]
    }
  });

  const transformTherapistForEngine = (therapist: Therapist): EngineTherapist => ({
    _id: therapist._id,
    name: therapist.name,
    email: therapist.email,
    gender: "female", // Default - would come from API
    profile: {
      specializations: therapist.profile?.specializations || [],
      yearsOfExperience: therapist.profile?.yearsOfExperience || 5,
      licenseNumber: therapist.profile?.licenseNumber || "N/A",
      maxPatients: 20
    },
    schedule: {
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "09:00", end: "17:00" },
      sessionDuration: 60
    },
    currentPatients: [],
    ratings: {
      averageRating: 4.5,
      totalReviews: 10,
      specialtyRatings: {}
    },
    availability: {
      "Monday": { "09:00": "available", "10:00": "available" },
      "Tuesday": { "09:00": "available", "10:00": "available" }
    }
  });

  // Get smart matches if enabled
  const getSmartMatches = () => {
    if (!patient || !useSmartMatching) return [];
    
    const enginePatient = transformPatientForEngine(patient);
    const engineTherapists = therapists.map(transformTherapistForEngine);
    
    return assignmentEngine.findBestMatches(enginePatient, engineTherapists, 10);
  };

  const smartMatches = useSmartMatching ? getSmartMatches() : [];

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         therapist.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = !filterSpecialization || 
                                 therapist.profile?.specializations?.includes(filterSpecialization);

    return therapist.isActive && matchesSearch && matchesSpecialization;
  });

  // Sort therapists by smart matching score if enabled
  const sortedTherapists = useSmartMatching 
    ? filteredTherapists.sort((a, b) => {
        const aMatch = smartMatches.find(m => m.therapistId === a._id);
        const bMatch = smartMatches.find(m => m.therapistId === b._id);
        const aScore = aMatch?.totalScore || 0;
        const bScore = bMatch?.totalScore || 0;
        return bScore - aScore;
      })
    : filteredTherapists;

  const getWorkloadColor = (count: number = 0) => {
    if (count <= 5) return "text-green-600";
    if (count <= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getWorkloadText = (count: number = 0) => {
    if (count <= 5) return "Beban Ringan";
    if (count <= 10) return "Beban Sedang";
    return "Beban Berat";
  };

  const isPatientConditionMatch = (therapist: Therapist) => {
    if (!patient?.medicalInfo?.conditions || patient.medicalInfo.conditions.length === 0) {
      return false;
    }

    const patientConditions = patient.medicalInfo.conditions.map(c => c.toLowerCase());
    const therapistSpecs = therapist.profile?.specializations?.map(s => s.toLowerCase()) || [];

    // Simple matching logic - can be made more sophisticated
    return patientConditions.some(condition => 
      therapistSpecs.some(spec => 
        spec.includes("autism") && condition.includes("autism") ||
        spec.includes("speech") && condition.includes("speech") ||
        spec.includes("behavioral") && condition.includes("behavioral") ||
        spec.includes("occupational") && condition.includes("motor")
      )
    );
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCheckIcon className="h-5 w-5 mr-2" />
            Tugaskan Terapis ke {patient.name}
          </DialogTitle>
          <DialogDescription>
            Pilih terapis paling sesuai untuk pasien ini berdasarkan spesialisasi dan beban kerja
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Informasi Pasien</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nama: </span>
                <span className="font-medium">{patient.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Usia: </span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                </span>
              </div>
              <div>
                <span className="text-gray-600">Orang Tua: </span>
                <span className="font-medium">{patient.parentId.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Jenis Kelamin: </span>
                <span className="font-medium capitalize">{patient.gender}</span>
              </div>
            </div>
            
            {patient.medicalInfo.conditions.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Kondisi Medis: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medicalInfo.conditions.map((condition, index) => (
                    <Badge key={index} variant="default" className="bg-red-100 text-red-800 text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Matching Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <input
              type="checkbox"
              id="smartMatching"
              checked={useSmartMatching}
              onChange={(e) => setUseSmartMatching(e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-600 border-gray-300 rounded"
            />
            <label htmlFor="smartMatching" className="flex items-center text-sm text-teal-800">
              <BrainIcon className="h-4 w-4 mr-2" />
              Aktifkan Smart Matching (rekomendasi berbasis AI)
            </label>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari terapis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterSpecialization}
              onValueChange={(value) => setFilterSpecialization(value)}
              options={[
                { value: "", label: "Semua Spesialisasi" },
                ...getSpecializations().map(spec => ({
                  value: spec,
                  label: spec
                }))
              ]}
            />
          </div>

          {/* Therapists List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : sortedTherapists.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Tidak ada terapis yang cocok dengan kriteria Anda</p>
              </div>
            ) : (
              sortedTherapists.map((therapist) => {
                const smartMatch = smartMatches.find(m => m.therapistId === therapist._id);
                const isRecommended = isPatientConditionMatch(therapist);
                const isTopMatch = useSmartMatching && smartMatch && smartMatch.totalScore >= 85;
                
                return (
                  <div
                    key={therapist._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTherapist === therapist._id
                        ? "border-teal-500 bg-teal-50"
                        : isTopMatch
                        ? "border-purple-300 bg-purple-50"
                        : isRecommended
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTherapist(therapist._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{therapist.name}</h4>
                          {isTopMatch && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs">
                              <SparklesIcon className="h-3 w-3 mr-1" />
                              Cocok Terbaik AI ({smartMatch?.totalScore}%)
                            </Badge>
                          )}
                          {isRecommended && !isTopMatch && (
                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                              Direkomendasikan
                            </Badge>
                          )}
                          {useSmartMatching && smartMatch && smartMatch.confidence && (
                            <Badge variant="default" className={`text-xs ${
                              smartMatch.confidence === "high" ? "bg-green-100 text-green-800" :
                              smartMatch.confidence === "medium" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {smartMatch.confidence} keyakinan
                            </Badge>
                          )}
                          <input
                            type="radio"
                            name="therapist"
                            checked={selectedTherapist === therapist._id}
                            onChange={() => setSelectedTherapist(therapist._id)}
                            className="text-teal-600"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            <div>{therapist.email}</div>
                            <div>
                              Pengalaman: {therapist.profile?.yearsOfExperience || 0} tahun
                            </div>
                            <div>
                              Lisensi: {therapist.profile?.licenseNumber}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <UsersIcon className="h-4 w-4 mr-1" />
                              <span className={getWorkloadColor(therapist.assignedPatientsCount)}>
                                {therapist.assignedPatientsCount || 0} pasien ({getWorkloadText(therapist.assignedPatientsCount)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {therapist.profile?.specializations && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {therapist.profile.specializations.map((spec, index) => (
                                <Badge key={index} variant="default" className="bg-teal-100 text-teal-800 text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedTherapist || isAssigning}
            >
              {isAssigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Menugaskan...
                </>
              ) : (
                <>
                  <UserCheckIcon className="h-4 w-4 mr-2" />
                  Tugaskan Terapis
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}