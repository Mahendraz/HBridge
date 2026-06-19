/**
 * Advanced Assignment Rules Engine
 * Intelligent patient-therapist matching system
 */

export interface Patient {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
  medicalInfo: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    notes: string;
  };
  parentId: {
    _id: string;
    name: string;
    email: string;
    location?: {
      address: string;
      coordinates: [number, number];
    };
  };
  preferences?: {
    therapistGender?: "male" | "female" | "no-preference";
    sessionTime?: "morning" | "afternoon" | "evening" | "no-preference";
    maxTravelDistance?: number; // in miles
    languagePreference?: string[];
  };
  priority: "urgent" | "high" | "normal" | "low";
  assignmentHistory?: string[]; // therapist IDs
}

export interface Therapist {
  _id: string;
  name: string;
  email: string;
  gender: "male" | "female";
  profile: {
    specializations: string[];
    yearsOfExperience: number;
    licenseNumber: string;
    languages?: string[];
    maxPatients?: number;
    location?: {
      address: string;
      coordinates: [number, number];
    };
  };
  schedule: {
    workingDays: string[];
    workingHours: { start: string; end: string; };
    sessionDuration: number;
  };
  currentPatients: string[];
  ratings: {
    averageRating: number;
    totalReviews: number;
    specialtyRatings: { [specialty: string]: number };
  };
  availability: {
    [day: string]: {
      [timeSlot: string]: "available" | "booked" | "blocked";
    };
  };
}

export interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, higher = more important
  type: "mandatory" | "preferred" | "bonus";
  evaluate: (patient: Patient, therapist: Therapist) => AssignmentScore;
}

export interface AssignmentScore {
  score: number; // 0-100
  reason: string;
  factors: string[];
  isValid: boolean;
}

export interface AssignmentResult {
  therapistId: string;
  therapistName: string;
  totalScore: number;
  confidence: "high" | "medium" | "low";
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  availability: {
    day: string;
    timeSlots: string[];
  }[];
  estimatedWaitTime?: number; // days
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

/**
 * Calculate distance between two coordinates (haversine formula)
 */
function calculateDistance(
  coord1: [number, number], 
  coord2: [number, number]
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Predefined assignment rules
 */
export const ASSIGNMENT_RULES: AssignmentRule[] = [
  // Mandatory Rules (Must match)
  {
    id: "specialty_match",
    name: "Specialty Matching",
    description: "Therapist must have relevant specializations for patient's conditions",
    weight: 100,
    type: "mandatory",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const conditions = patient.medicalInfo.conditions.map(c => c.toLowerCase());
      const specializations = therapist.profile.specializations.map(s => s.toLowerCase());
      
      // Define condition-to-specialty mappings
      const specialtyMappings: { [key: string]: string[] } = {
        "autism": ["autism spectrum therapy", "behavioral therapy", "aba therapy"],
        "speech delay": ["speech therapy", "language development"],
        "adhd": ["behavioral therapy", "attention deficit therapy"],
        "sensory": ["occupational therapy", "sensory integration"],
        "motor": ["physical therapy", "occupational therapy", "motor skills"],
        "behavioral": ["behavioral therapy", "applied behavior analysis"],
        "developmental": ["developmental therapy", "early intervention"]
      };

      let matches = 0;
      const matchedSpecialties: string[] = [];
      
      conditions.forEach(condition => {
        for (const [conditionKey, requiredSpecs] of Object.entries(specialtyMappings)) {
          if (condition.includes(conditionKey)) {
            const hasMatch = requiredSpecs.some(spec => 
              specializations.some(therapistSpec => therapistSpec.includes(spec))
            );
            if (hasMatch) {
              matches++;
              matchedSpecialties.push(conditionKey);
            }
          }
        }
      });

      const score = conditions.length > 0 ? (matches / conditions.length) * 100 : 100;
      
      return {
        score,
        reason: score >= 50 
          ? `Strong specialty match (${matches}/${conditions.length} conditions matched)`
          : `Insufficient specialty match (${matches}/${conditions.length} conditions matched)`,
        factors: matchedSpecialties.map(s => `Matched ${s} specialty`),
        isValid: score >= 50
      };
    }
  },

  {
    id: "capacity_check",
    name: "Therapist Capacity",
    description: "Therapist must have availability for new patients",
    weight: 95,
    type: "mandatory",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const maxPatients = therapist.profile.maxPatients || 20;
      const currentPatients = therapist.currentPatients.length;
      const utilizationRate = (currentPatients / maxPatients) * 100;
      
      let score = 100;
      let reason = "Available capacity";
      
      if (currentPatients >= maxPatients) {
        score = 0;
        reason = "At maximum capacity";
      } else if (utilizationRate > 90) {
        score = 30;
        reason = "Near capacity (>90%)";
      } else if (utilizationRate > 80) {
        score = 60;
        reason = "High utilization (>80%)";
      } else if (utilizationRate > 60) {
        score = 80;
        reason = "Moderate utilization";
      }
      
      return {
        score,
        reason,
        factors: [`Current load: ${currentPatients}/${maxPatients} patients`],
        isValid: score > 0
      };
    }
  },

  // Preferred Rules (Strongly recommended)
  {
    id: "experience_level",
    name: "Experience Level",
    description: "Match therapist experience with patient complexity",
    weight: 80,
    type: "preferred",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const experience = therapist.profile.yearsOfExperience;
      const conditionCount = patient.medicalInfo.conditions.length;
      const patientAge = calculateAge(patient.dateOfBirth);
      
      // Complex cases need more experienced therapists
      let requiredExperience = 0;
      if (conditionCount >= 3 || patientAge < 3) requiredExperience = 5;
      else if (conditionCount >= 2 || patientAge < 5) requiredExperience = 3;
      else requiredExperience = 1;

      let score = 100;
      let reason = "Excellent experience match";
      
      if (experience < requiredExperience) {
        const deficit = requiredExperience - experience;
        score = Math.max(20, 100 - (deficit * 25));
        reason = `Less experience than ideal (${experience} vs ${requiredExperience} years)`;
      } else if (experience >= requiredExperience * 2) {
        score = 95;
        reason = "Highly experienced for this case";
      }
      
      return {
        score,
        reason,
        factors: [
          `${experience} years experience`,
          `Patient complexity: ${conditionCount} conditions`,
          `Patient age: ${patientAge} years`
        ],
        isValid: true
      };
    }
  },

  {
    id: "therapist_rating",
    name: "Therapist Rating",
    description: "Prefer higher-rated therapists",
    weight: 70,
    type: "preferred",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const rating = therapist.ratings.averageRating;
      const reviewCount = therapist.ratings.totalReviews;
      
      // Adjust score based on number of reviews (confidence factor)
      let confidenceFactor = 1;
      if (reviewCount < 5) confidenceFactor = 0.7;
      else if (reviewCount < 10) confidenceFactor = 0.85;
      
      const score = (rating / 5) * 100 * confidenceFactor;
      
      return {
        score,
        reason: `${rating}/5 stars (${reviewCount} reviews)`,
        factors: [`Average rating: ${rating}/5`, `Review count: ${reviewCount}`],
        isValid: true
      };
    }
  },

  {
    id: "gender_preference",
    name: "Gender Preference",
    description: "Match patient gender preference",
    weight: 60,
    type: "preferred",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const preference = patient.preferences?.therapistGender;
      
      if (!preference || preference === "no-preference") {
        return {
          score: 100,
          reason: "No gender preference specified",
          factors: ["Gender neutral"],
          isValid: true
        };
      }
      
      const matches = therapist.gender === preference;
      return {
        score: matches ? 100 : 30,
        reason: matches 
          ? `Matches preferred gender (${preference})`
          : `Does not match preferred gender (${preference})`,
        factors: [`Therapist: ${therapist.gender}`, `Preference: ${preference}`],
        isValid: true
      };
    }
  },

  {
    id: "location_proximity",
    name: "Location Proximity",
    description: "Prefer therapists closer to patient",
    weight: 50,
    type: "preferred",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const patientLocation = patient.parentId.location?.coordinates;
      const therapistLocation = therapist.profile.location?.coordinates;
      
      if (!patientLocation || !therapistLocation) {
        return {
          score: 70, // Neutral if location data unavailable
          reason: "Location data not available",
          factors: ["Location matching skipped"],
          isValid: true
        };
      }
      
      const distance = calculateDistance(patientLocation, therapistLocation);
      const maxPreferredDistance = patient.preferences?.maxTravelDistance || 25; // default 25 miles
      
      let score = 100;
      let reason = `${distance.toFixed(1)} miles away`;
      
      if (distance > maxPreferredDistance) {
        score = Math.max(20, 100 - ((distance - maxPreferredDistance) * 5));
        reason += ` (exceeds preferred ${maxPreferredDistance} miles)`;
      } else if (distance > 15) {
        score = 80;
        reason += " (moderate distance)";
      } else if (distance > 5) {
        score = 90;
        reason += " (close proximity)";
      } else {
        score = 100;
        reason += " (very close)";
      }
      
      return {
        score,
        reason,
        factors: [`Distance: ${distance.toFixed(1)} miles`],
        isValid: true
      };
    }
  },

  // Bonus Rules (Nice to have)
  {
    id: "language_preference",
    name: "Language Preference",
    description: "Match language preferences",
    weight: 40,
    type: "bonus",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const patientLanguages = patient.preferences?.languagePreference || ["English"];
      const therapistLanguages = therapist.profile.languages || ["English"];
      
      const commonLanguages = patientLanguages.filter(lang => 
        therapistLanguages.includes(lang)
      );
      
      const score = commonLanguages.length > 0 ? 100 : 50;
      
      return {
        score,
        reason: commonLanguages.length > 0 
          ? `Shared languages: ${commonLanguages.join(", ")}`
          : "No shared language preferences",
        factors: [
          `Patient languages: ${patientLanguages.join(", ")}`,
          `Therapist languages: ${therapistLanguages.join(", ")}`
        ],
        isValid: true
      };
    }
  },

  {
    id: "schedule_compatibility",
    name: "Schedule Compatibility",
    description: "Match preferred session times",
    weight: 45,
    type: "bonus",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const timePreference = patient.preferences?.sessionTime;
      
      if (!timePreference || timePreference === "no-preference") {
        return {
          score: 100,
          reason: "No time preference specified",
          factors: ["Flexible scheduling"],
          isValid: true
        };
      }
      
      const startHour = parseInt(therapist.schedule.workingHours.start.split(":")[0]);
      const endHour = parseInt(therapist.schedule.workingHours.end.split(":")[0]);
      
      let compatible = false;
      let reason = "";
      
      switch (timePreference) {
        case "morning":
          compatible = startHour <= 9;
          reason = `Morning sessions ${compatible ? "available" : "not available"}`;
          break;
        case "afternoon":
          compatible = startHour <= 14 && endHour >= 15;
          reason = `Afternoon sessions ${compatible ? "available" : "not available"}`;
          break;
        case "evening":
          compatible = endHour >= 17;
          reason = `Evening sessions ${compatible ? "available" : "not available"}`;
          break;
      }
      
      return {
        score: compatible ? 100 : 40,
        reason,
        factors: [
          `Working hours: ${therapist.schedule.workingHours.start}-${therapist.schedule.workingHours.end}`,
          `Preference: ${timePreference}`
        ],
        isValid: true
      };
    }
  },

  {
    id: "assignment_history",
    name: "Assignment History",
    description: "Avoid reassigning to previous therapists unless necessary",
    weight: 30,
    type: "bonus",
    evaluate: (patient: Patient, therapist: Therapist): AssignmentScore => {
      const previousTherapists = patient.assignmentHistory || [];
      const wasPreviouslyAssigned = previousTherapists.includes(therapist._id);
      
      if (wasPreviouslyAssigned) {
        return {
          score: 60, // Slight penalty for reassignment
          reason: "Previously assigned therapist",
          factors: ["May indicate previous assignment challenges"],
          isValid: true
        };
      }
      
      return {
        score: 100,
        reason: "New therapist assignment",
        factors: ["Fresh therapeutic relationship"],
        isValid: true
      };
    }
  }
];

/**
 * Advanced Assignment Engine
 */
export class AssignmentEngine {
  private rules: AssignmentRule[];
  
  constructor(customRules?: AssignmentRule[]) {
    this.rules = customRules || ASSIGNMENT_RULES;
  }

  /**
   * Find best therapist matches for a patient
   */
  public findBestMatches(
    patient: Patient, 
    availableTherapists: Therapist[],
    maxResults: number = 5
  ): AssignmentResult[] {
    const results: AssignmentResult[] = [];

    for (const therapist of availableTherapists) {
      const evaluation = this.evaluateMatch(patient, therapist);
      results.push(evaluation);
    }

    // Sort by total score (descending)
    results.sort((a, b) => b.totalScore - a.totalScore);

    // Return top matches
    return results.slice(0, maxResults);
  }

  /**
   * Evaluate patient-therapist match
   */
  private evaluateMatch(patient: Patient, therapist: Therapist): AssignmentResult {
    let totalScore = 0;
    let weightSum = 0;
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];
    const neutralFactors: string[] = [];
    let isValidAssignment = true;

    // Evaluate each rule
    for (const rule of this.rules) {
      const evaluation = rule.evaluate(patient, therapist);
      
      // Check if mandatory rule failed
      if (rule.type === "mandatory" && !evaluation.isValid) {
        isValidAssignment = false;
      }

      // Weight the score
      const weightedScore = (evaluation.score * rule.weight) / 100;
      totalScore += weightedScore;
      weightSum += rule.weight;

      // Categorize factors
      if (evaluation.score >= 80) {
        positiveFactors.push(evaluation.reason);
      } else if (evaluation.score <= 40) {
        negativeFactors.push(evaluation.reason);
      } else {
        neutralFactors.push(evaluation.reason);
      }
    }

    // Normalize total score
    const normalizedScore = weightSum > 0 ? (totalScore / weightSum) * 100 : 0;

    // Calculate confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (normalizedScore >= 85 && isValidAssignment) confidence = "high";
    else if (normalizedScore >= 70 && isValidAssignment) confidence = "medium";

    // Generate availability slots
    const availability = this.generateAvailabilitySlots(therapist);

    return {
      therapistId: therapist._id,
      therapistName: therapist.name,
      totalScore: isValidAssignment ? Math.round(normalizedScore) : 0,
      confidence,
      factors: {
        positive: positiveFactors,
        negative: negativeFactors,
        neutral: neutralFactors
      },
      availability,
      estimatedWaitTime: this.calculateWaitTime(therapist)
    };
  }

  /**
   * Generate available time slots for therapist
   */
  private generateAvailabilitySlots(therapist: Therapist): { day: string; timeSlots: string[]; }[] {
    const availability: { day: string; timeSlots: string[]; }[] = [];

    for (const day of therapist.schedule.workingDays) {
      const dayAvailability = therapist.availability[day] || {};
      const availableSlots: string[] = [];

      // Generate time slots
      const startHour = parseInt(therapist.schedule.workingHours.start.split(":")[0]);
      const endHour = parseInt(therapist.schedule.workingHours.end.split(":")[0]);
      const sessionDuration = therapist.schedule.sessionDuration;

      for (let hour = startHour; hour < endHour; hour += sessionDuration / 60) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
        
        if (dayAvailability[timeSlot] === "available" || !dayAvailability[timeSlot]) {
          availableSlots.push(timeSlot);
        }
      }

      if (availableSlots.length > 0) {
        availability.push({
          day,
          timeSlots: availableSlots.slice(0, 3) // Show first 3 available slots
        });
      }
    }

    return availability;
  }

  /**
   * Calculate estimated wait time for assignment
   */
  private calculateWaitTime(therapist: Therapist): number {
    const utilizationRate = therapist.currentPatients.length / (therapist.profile.maxPatients || 20);
    
    if (utilizationRate < 0.5) return 1; // 1 day
    if (utilizationRate < 0.7) return 3; // 3 days  
    if (utilizationRate < 0.9) return 7; // 1 week
    return 14; // 2 weeks
  }

  /**
   * Add custom rule
   */
  public addRule(rule: AssignmentRule): void {
    this.rules.push(rule);
    // Sort rules by weight (highest first)
    this.rules.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Remove rule by ID
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all rules
   */
  public getRules(): AssignmentRule[] {
    return [...this.rules];
  }

  /**
   * Auto-assign patient to best therapist
   */
  public autoAssign(
    patient: Patient,
    availableTherapists: Therapist[]
  ): AssignmentResult | null {
    const matches = this.findBestMatches(patient, availableTherapists, 1);
    
    if (matches.length > 0 && matches[0].totalScore >= 70 && matches[0].confidence !== "low") {
      return matches[0];
    }
    
    return null; // No suitable match found
  }
}