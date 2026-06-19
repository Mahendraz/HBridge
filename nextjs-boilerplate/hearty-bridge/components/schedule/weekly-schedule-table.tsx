"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserIcon, ClockIcon, PhoneIcon, VideoIcon } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  sessionType: string;
  phone?: string;
}

interface TimeSlot {
  time: string;
  hour: number;
  patients: {
    [key: number]: Patient | null; // dayIndex (0=Monday, 1=Tuesday, etc.)
  };
}

interface WeeklyScheduleTableProps {
  weekStartDate: string;
  onPatientClick?: (patient: Patient, day: string, time: string) => void;
  onSlotClick?: (day: string, time: string) => void;
  assignedPatients?: Patient[];
}

export function WeeklyScheduleTable({
  weekStartDate,
  onPatientClick,
  onSlotClick,
  assignedPatients = []
}: WeeklyScheduleTableProps) {
  // Indonesian day names
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  // Time slots from 9 AM to 5 PM (9:00 - 17:00)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        patients: {}
      });
    }
    return slots;
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const slots = generateTimeSlots();
    
    // Sample data - assign some patients to demonstrate the layout
    if (assignedPatients.length > 0) {
      // Monday 9 AM
      slots[0].patients[0] = assignedPatients[0] || null;
      // Tuesday 10 AM
      if (slots[1] && assignedPatients[1]) {
        slots[1].patients[1] = assignedPatients[1];
      }
      // Wednesday 2 PM
      if (slots[5] && assignedPatients[0]) {
        slots[5].patients[2] = assignedPatients[0];
      }
    }
    
    return slots;
  });

  const formatDate = (dayIndex: number): string => {
    const startDate = new Date(weekStartDate);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayIndex);
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const handleSlotClick = (dayIndex: number, timeSlot: TimeSlot) => {
    const dayName = days[dayIndex];
    const patient = timeSlot.patients[dayIndex];
    
    if (patient && onPatientClick) {
      onPatientClick(patient, dayName, timeSlot.time);
    } else if (!patient && onSlotClick) {
      onSlotClick(dayName, timeSlot.time);
    }
  };

  const getSlotContent = (dayIndex: number, timeSlot: TimeSlot) => {
    const patient = timeSlot.patients[dayIndex];
    
    if (patient) {
      return (
        <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-teal-800 truncate">
                {patient.name}
              </p>
              <p className="text-xs text-teal-700 truncate">
                {patient.sessionType}
              </p>
            </div>
            <UserIcon className="h-3 w-3 text-teal-600 flex-shrink-0 ml-1" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer min-h-[60px] flex items-center justify-center">
        <span className="text-xs text-gray-500">Tersedia</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Jadwal Mingguan</span>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>09:00 - 17:00</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-gray-50 px-4 py-3 text-left">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="font-medium text-gray-900">Waktu</span>
                  </div>
                </th>
                {days.map((day, index) => (
                  <th key={day} className="border border-gray-200 bg-gray-50 px-4 py-3 text-center min-w-[160px]">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{day}</div>
                      <div className="text-xs text-gray-600">{formatDate(index)}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, timeIndex) => (
                <tr key={timeSlot.time}>
                  <td className="border border-gray-200 px-4 py-3 bg-gray-50">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{timeSlot.time}</span>
                      <span className="text-xs text-gray-600 ml-2">- {(timeSlot.hour + 1).toString().padStart(2, '0')}:00</span>
                    </div>
                  </td>
                  {days.map((day, dayIndex) => (
                    <td 
                      key={`${day}-${timeSlot.time}`} 
                      className="border border-gray-200 px-3 py-2"
                      onClick={() => handleSlotClick(dayIndex, timeSlot)}
                    >
                      {getSlotContent(dayIndex, timeSlot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-teal-50 border border-teal-200 rounded mr-2"></div>
            <span className="text-gray-600">Pasien Terjadwal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-dashed border-gray-200 rounded mr-2"></div>
            <span className="text-gray-600">Slot Tersedia</span>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            Klik slot untuk menambah/mengedit pasien
          </div>
        </div>
      </CardContent>
    </Card>
  );
}