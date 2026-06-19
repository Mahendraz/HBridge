"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  UserIcon, 
  SearchIcon, 
  ClockIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon 
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  diagnosis?: string;
  sessionType?: string;
  phone?: string;
  parentName?: string;
}

interface PatientAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: string;
  selectedTime: string;
  availablePatients: Patient[];
  onAssign: (patient: Patient, sessionType: string, location: 'in-person' | 'virtual') => void;
}

const sessionTypes = [
  "Speech Therapy",
  "Occupational Therapy", 
  "Physical Therapy",
  "Behavioral Therapy",
  "Assessment",
  "Consultation",
  "Follow-up"
];

export function PatientAssignmentModal({
  open,
  onOpenChange,
  selectedDay,
  selectedTime,
  availablePatients,
  onAssign
}: PatientAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState("Speech Therapy");
  const [selectedLocation, setSelectedLocation] = useState<'in-person' | 'virtual'>('in-person');

  const filteredPatients = availablePatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.diagnosis && patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssign = () => {
    if (selectedPatient) {
      onAssign(selectedPatient, selectedSessionType, selectedLocation);
      onOpenChange(false);
      setSelectedPatient(null);
      setSearchQuery("");
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-600">
            <CalendarIcon className="h-5 w-5 text-teal-600" />
            Assign Pasien ke Jadwal
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            <span className="font-medium">{selectedDay}</span> pada jam{" "}
            <span className="font-medium">{selectedTime}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
            <Input
              placeholder="Cari pasien berdasarkan nama atau diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-gray-900"
            />
          </div>

          {/* Patient List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Tidak ada pasien ditemukan</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <Card 
                  key={patient.id}
                  className={`cursor-pointer transition-all ${
                    selectedPatient?.id === patient.id 
                      ? 'ring-2 ring-teal-500 bg-teal-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt="" />
                        <AvatarFallback className="bg-green-100 text-teal-700">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {patient.name}
                          </h3>
                          {patient.dateOfBirth && (
                            <span className="text-xs text-gray-500">
                              {calculateAge(patient.dateOfBirth)} tahun
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1">
                          {patient.diagnosis && (
                            <Badge variant="secondary" className="text-xs">
                              {patient.diagnosis}
                            </Badge>
                          )}
                          {patient.parentName && (
                            <span className="text-xs text-gray-500">
                              Ortu: {patient.parentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Session Configuration */}
          {selectedPatient && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-gray-900">Konfigurasi Sesi</h4>
              
              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Terapi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sessionTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedSessionType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSessionType(type)}
                      className="justify-start"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi Sesi
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedLocation === 'in-person' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLocation('in-person')}
                    className="flex items-center gap-2"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Tatap Muka
                  </Button>
                  <Button
                    variant={selectedLocation === 'virtual' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLocation('virtual')}
                    className="flex items-center gap-2"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Online
                  </Button>
                </div>
              </div>

              {/* Selected Patient Summary */}
              <Card className="bg-teal-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-teal-800">
                        {selectedPatient.name}
                      </p>
                      <p className="text-sm text-teal-700">
                        {selectedSessionType} • {selectedLocation === 'in-person' ? 'Tatap Muka' : 'Online'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-teal-700">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {selectedTime}
                      </div>
                      <div className="text-xs text-teal-600">
                        {selectedDay}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedPatient}
          >
            Assign Pasien
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}