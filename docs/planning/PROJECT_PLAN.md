# Hearty Bridge - Project Plan & Documentation

## **Project Overview**

**Project Name:** Hearty Bridge  
**Type:** Child Development Monitoring Application  
**Target Users:** Therapists & Parents  
**Age Range:** 0-12 years (before middle school)

### **Core Concept**
Aplikasi untuk memantau dan melacak perkembangan anak dengan dua role utama:
- **Therapists**: Membuat assessment, input progress, memberikan rekomendasi
- **Parents**: Melihat progress anak, mendapatkan insight perkembangan

### **Key Requirements**
- ✅ Target usia: 0-12 tahun
- ✅ Area perkembangan: Fleksibel sesuai kebutuhan (tidak standar tertentu)
- ✅ Role-based access (Therapist vs Parent)
- ✅ Progress tracking & visualization
- ❌ Communication features (skip untuk phase awal)
- ❌ Multi-child support (skip untuk phase awal) 
- ❌ Appointment system (skip untuk phase awal)

---

## **Technology Stack**

### **Frontend**
- Next.js 15 dengan App Router
- TypeScript untuk type safety
- Tailwind CSS untuk styling
- Shadcn/ui untuk component library

### **Backend**
- Next.js API Routes
- MongoDB dengan Mongoose ODM
- JWT untuk authentication

### **Additional Tools**
- Chart.js/Recharts untuk data visualization
- React Hook Form untuk form management
- Zod untuk validation
- Date-fns untuk date handling

---

## **Database Schema Overview**

### **Users Collection**
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string; // hashed
  role: 'therapist' | 'parent';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Children Collection**
```typescript
interface Child {
  _id: ObjectId;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  parentId: ObjectId; // reference to User
  therapistId?: ObjectId; // reference to User
  medicalInfo?: {
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Assessment Templates Collection**
```typescript
interface AssessmentTemplate {
  _id: ObjectId;
  name: string;
  description?: string;
  category: string; // motorik, kognitif, bahasa, sosial, dll
  fields: AssessmentField[];
  ageRange: {
    minMonths: number;
    maxMonths: number;
  };
  createdBy: ObjectId; // therapist
  isActive: boolean;
  createdAt: Date;
}

interface AssessmentField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'scale';
  options?: string[]; // for select type
  scaleRange?: { min: number; max: number; }; // for scale type
  required: boolean;
}
```

### **Progress Entries Collection**
```typescript
interface ProgressEntry {
  _id: ObjectId;
  childId: ObjectId;
  therapistId: ObjectId;
  templateId: ObjectId;
  assessmentDate: Date;
  data: Record<string, any>; // flexible data structure
  notes?: string;
  recommendations?: string[];
  nextAssessmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **Project Phases**

### **Phase 1: Foundation & Authentication** ⏱️ **Week 1-2**
**Status:** 🟡 Planning  
**Goal:** Setup dasar dengan user management dan role-based access

#### **Features:**
- [x] Project setup dan initial configuration
- [ ] User authentication (register/login/logout)
- [ ] Role-based routing (therapist vs parent)
- [ ] Basic profile management
- [ ] Child profile creation dan management

#### **Deliverables:**
- Working authentication system dengan role detection
- Protected routes berdasarkan role
- Basic UI framework dan layout
- Child profile CRUD operations

#### **Success Criteria:**
- User bisa register sebagai therapist atau parent
- Login/logout berfungsi dengan baik
- Role-based dashboard redirect yang benar
- Child profile bisa dibuat dan dimanage

---

### **Phase 2: Assessment System** ⏱️ **Week 3-4**
**Status:** 🔴 Not Started  
**Goal:** Core assessment dan progress tracking untuk therapists

#### **Features:**
- [ ] Assessment template builder (flexible)
- [ ] Progress entry system untuk therapists
- [ ] Basic data visualization (charts)
- [ ] Assessment history tracking

#### **Deliverables:**
- Assessment template creation system
- Progress data entry forms yang user-friendly
- Basic charts untuk visualisasi progress
- Assessment history dan timeline

#### **Success Criteria:**
- Therapist bisa membuat custom assessment templates
- Input progress data yang mudah dan intuitif
- Data tersimpan dengan benar di database
- Basic charts menampilkan trend progress

---

### **Phase 3: Parent Portal & Visualization** ⏱️ **Week 5-6**
**Status:** 🔴 Not Started  
**Goal:** Parent interface untuk melihat progress anak

#### **Features:**
- [ ] Parent dashboard dengan child progress overview
- [ ] Progress history dan trend visualization
- [ ] Assessment results view
- [ ] Basic progress reports (PDF export)

#### **Deliverables:**
- Parent-friendly dashboard interface
- Interactive progress charts dan graphs
- Assessment results dalam format yang mudah dipahami
- Downloadable progress reports

#### **Success Criteria:**
- Parent bisa melihat progress anak dengan jelas
- Charts dan visualisasi mudah dipahami
- Progress reports bisa di-download sebagai PDF
- Interface responsive untuk mobile

---

### **Phase 4: Polish & Production Ready** ⏱️ **Week 7-8**
**Status:** 🔴 Not Started  
**Goal:** Finalisasi dan optimisasi untuk production

#### **Features:**
- [ ] UI/UX improvements dan consistency
- [ ] Performance optimization
- [ ] Error handling dan validation yang comprehensive
- [ ] Security improvements
- [ ] Mobile responsiveness
- [ ] Documentation completion

#### **Deliverables:**
- Production-ready application
- Complete user manual
- Testing documentation
- Deployment guide

#### **Success Criteria:**
- Aplikasi stabil dan performant
- No critical bugs atau security issues
- Mobile-friendly pada semua devices
- Documentation lengkap untuk user dan developer

---

## **Testing Strategy**

### **Manual Testing Checklist**
Setiap phase akan memiliki testing checklist yang harus dijalankan secara manual untuk memastikan functionality bekerja dengan baik.

### **User Acceptance Testing (UAT)**
- Testing dengan actual therapist dan parent users
- Feedback collection dan improvement iteration
- Real-world scenario testing

---

## **Project Timeline**

```
Week 1-2: Phase 1 (Foundation)
Week 3-4: Phase 2 (Assessment System) 
Week 5-6: Phase 3 (Parent Portal)
Week 7-8: Phase 4 (Polish & Production)
```

**Total Duration:** 8 weeks  
**Start Date:** TBD  
**Target Completion:** TBD

---

## **Risk Assessment**

### **Technical Risks**
- Database schema changes yang complex
- Performance issues dengan large datasets
- Security vulnerabilities

### **Mitigation Strategies**
- Modular database design untuk flexibility
- Pagination dan caching untuk performance
- Regular security audits dan best practices

---

*This document will be updated throughout the project lifecycle to reflect current status and any changes to the plan.*