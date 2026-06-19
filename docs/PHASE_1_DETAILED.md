# Phase 1: Foundation & Authentication - Detailed Plan

**Duration:** Week 1-2  
**Status:** 🟡 Planning  
**Goal:** Setup dasar aplikasi dengan user management dan role-based access control

---

## **Phase 1 Tasks Breakdown**

### **Task 1.1: Project Setup & Configuration**
**Estimated Time:** 4-6 hours  
**Priority:** High

#### **Subtasks:**
- [x] Create new Next.js project "hearty-bridge"
- [ ] Install dan configure dependencies (MongoDB, Mongoose, JWT, etc)
- [ ] Setup project structure dan folder organization
- [ ] Configure environment variables
- [ ] Setup ESLint, Prettier, dan TypeScript config
- [ ] Initialize Git repository

#### **Acceptance Criteria:**
- Project runs dengan `npm run dev`
- TypeScript compilation tanpa errors
- Linting dan formatting rules active
- Environment variables properly loaded

---

### **Task 1.2: Database Setup & Connection**
**Estimated Time:** 3-4 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Setup MongoDB connection utility
- [ ] Create database connection middleware
- [ ] Configure MongoDB URI dan connection options
- [ ] Test database connectivity
- [ ] Setup database seeding script structure

#### **Acceptance Criteria:**
- Successful MongoDB connection
- Connection pooling properly configured
- Error handling untuk database connection failures
- Database connection logging implemented

---

### **Task 1.3: User Model & Authentication System**
**Estimated Time:** 6-8 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Create User model dengan Mongoose schema
- [ ] Implement password hashing dengan bcrypt
- [ ] Create JWT utility functions
- [ ] Build authentication middleware
- [ ] Implement role-based access control

#### **User Model Schema:**
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password: string; // hashed with bcrypt
  role: 'therapist' | 'parent';
  phone?: string;
  avatar?: string;
  profile?: {
    specialization?: string; // for therapists
    clinic?: string; // for therapists
    experience?: number; // for therapists
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Acceptance Criteria:**
- User model dengan proper validation
- Password hashing berfungsi dengan baik
- JWT token generation dan verification
- Role-based middleware protection
- Input validation untuk registration data

---

### **Task 1.4: Child Model & Relationship**
**Estimated Time:** 4-5 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Create Child model dengan relationship ke User (parent)
- [ ] Implement child age calculation utilities
- [ ] Create child validation rules
- [ ] Setup child-parent relationship queries

#### **Child Model Schema:**
```typescript
interface Child {
  _id: ObjectId;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  parentId: ObjectId; // reference to parent User
  therapistId?: ObjectId; // reference to therapist User
  medicalInfo?: {
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    notes?: string;
  };
  contactInfo?: {
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Acceptance Criteria:**
- Child model dengan proper validation
- Age calculation yang akurat
- Parent-child relationship queries berfungsi
- Medical info optional fields properly handled

---

### **Task 1.5: Authentication API Routes**
**Estimated Time:** 5-6 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Build registration API endpoint
- [ ] Build login API endpoint  
- [ ] Build logout API endpoint
- [ ] Build profile API endpoints
- [ ] Implement proper error handling
- [ ] Add input validation untuk semua endpoints

#### **API Endpoints:**
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user profile
PUT /api/auth/profile - Update user profile
```

#### **Acceptance Criteria:**
- Semua auth endpoints berfungsi dengan baik
- Proper HTTP status codes
- Input validation dan error messages yang jelas
- JWT cookies properly set dan cleared
- Role information included dalam response

---

### **Task 1.6: Registration & Login Pages**
**Estimated Time:** 6-8 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Create registration page dengan role selection
- [ ] Create login page
- [ ] Implement form validation dengan React Hook Form
- [ ] Add loading states dan error handling
- [ ] Create responsive design untuk mobile

#### **Page Features:**
- **Registration:**
  - Role selection (Therapist/Parent)
  - Form fields: name, email, password, confirm password, phone
  - Additional fields for therapists (specialization, clinic)
  - Terms & conditions checkbox
  - Loading state during registration
  - Error handling dan validation messages

- **Login:**
  - Email/password fields
  - "Remember me" checkbox
  - "Forgot password" link (placeholder)
  - Loading state
  - Redirect based on role

#### **Acceptance Criteria:**
- Forms dengan proper validation
- Role selection berfungsi dengan baik
- Loading states yang smooth
- Error messages yang user-friendly
- Mobile responsive design
- Proper redirect setelah login berdasarkan role

---

### **Task 1.7: Role-Based Dashboard Routing**
**Estimated Time:** 4-5 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Create protected route wrapper/middleware
- [ ] Build therapist dashboard layout
- [ ] Build parent dashboard layout
- [ ] Implement role-based navigation
- [ ] Add role checking utilities

#### **Dashboard Structure:**
```
/dashboard/therapist - Therapist Dashboard
/dashboard/parent - Parent Dashboard
/profile - User Profile (both roles)
/children - Child Management (both roles, different views)
```

#### **Acceptance Criteria:**
- Role-based routing berfungsi dengan benar
- Unauthorized access properly blocked
- Dashboard layout sesuai dengan role
- Navigation menu adapted berdasarkan role
- Smooth transitions antar pages

---

### **Task 1.8: Child Profile CRUD Operations**
**Estimated Time:** 6-8 hours  
**Priority:** High

#### **Subtasks:**
- [ ] Build child profile API endpoints
- [ ] Create child profile forms
- [ ] Implement child listing page
- [ ] Add child profile detail view
- [ ] Create child edit/delete functionality

#### **Child Management Features:**
- **For Parents:**
  - View own children
  - Add new child
  - Edit child information
  - View child's assigned therapist

- **For Therapists:**
  - View assigned children
  - Search children database
  - Add assessment notes
  - Update medical information

#### **API Endpoints:**
```
GET /api/children - Get children (filtered by role)
POST /api/children - Create new child
GET /api/children/[id] - Get child details
PUT /api/children/[id] - Update child
DELETE /api/children/[id] - Delete child (soft delete)
```

#### **Acceptance Criteria:**
- CRUD operations berfungsi untuk child profiles
- Role-based data filtering
- Form validation yang comprehensive
- Medical info handling yang secure
- Age calculation dan display yang akurat

---

### **Task 1.9: Basic UI Components & Layout**
**Estimated Time:** 5-6 hours  
**Priority:** Medium

#### **Subtasks:**
- [ ] Create reusable UI components (Button, Input, Card, etc)
- [ ] Build main layout dengan navigation
- [ ] Implement responsive design system
- [ ] Add loading spinners dan basic animations
- [ ] Create error boundary components

#### **UI Components:**
- Button (various styles dan sizes)
- Input fields (text, email, password, select)
- Form components (with validation)
- Card components
- Navigation bar
- Sidebar (untuk dashboard)
- Modal/Dialog components
- Loading indicators

#### **Acceptance Criteria:**
- Consistent design system
- All components responsive
- Accessibility compliance (basic)
- Reusable dan properly typed components
- Smooth animations dan transitions

---

## **Phase 1 Testing Guide**

### **Manual Testing Checklist**

#### **Authentication Testing:**
- [ ] **Registration as Therapist:**
  1. Navigate to /register
  2. Select "Therapist" role
  3. Fill all required fields
  4. Submit form
  5. Verify account created
  6. Verify redirect to therapist dashboard

- [ ] **Registration as Parent:**
  1. Navigate to /register
  2. Select "Parent" role
  3. Fill all required fields
  4. Submit form
  5. Verify account created
  6. Verify redirect to parent dashboard

- [ ] **Login Testing:**
  1. Navigate to /login
  2. Enter valid credentials
  3. Verify successful login
  4. Verify correct dashboard redirect based on role
  5. Test "remember me" functionality

- [ ] **Logout Testing:**
  1. Click logout button
  2. Verify redirect to login page
  3. Verify session cleared
  4. Try accessing protected route (should redirect to login)

#### **Role-Based Access Testing:**
- [ ] **Therapist Access:**
  1. Login as therapist
  2. Verify access to therapist dashboard
  3. Try accessing parent-only routes (should be blocked)
  4. Verify therapist-specific navigation items

- [ ] **Parent Access:**
  1. Login as parent
  2. Verify access to parent dashboard
  3. Try accessing therapist-only routes (should be blocked)
  4. Verify parent-specific navigation items

#### **Child Profile Testing:**
- [ ] **Child Creation (Parent):**
  1. Login as parent
  2. Navigate to children section
  3. Click "Add Child"
  4. Fill child information form
  5. Submit dan verify child created
  6. Verify child appears in children list

- [ ] **Child Management:**
  1. Edit child information
  2. Verify changes saved
  3. Test medical info updates
  4. Test child deletion (soft delete)
  5. Verify child no longer appears in active list

#### **Form Validation Testing:**
- [ ] Test required field validation
- [ ] Test email format validation
- [ ] Test password strength requirements
- [ ] Test date validation untuk child DOB
- [ ] Test phone number format

#### **Responsive Design Testing:**
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test on tablet sizes
- [ ] Test on desktop (various resolutions)
- [ ] Verify navigation works on mobile
- [ ] Verify forms usable on touch devices

### **Error Scenarios Testing:**
- [ ] Test with invalid login credentials
- [ ] Test with network connection issues
- [ ] Test dengan malformed API requests
- [ ] Test with expired JWT tokens
- [ ] Test database connection failures

---

## **Phase 1 Success Metrics**

### **Functional Requirements:**
- ✅ User registration/login system functional
- ✅ Role-based access control working
- ✅ Child profile CRUD operations complete
- ✅ Protected routes implemented
- ✅ Basic UI framework established

### **Technical Requirements:**
- ✅ MongoDB connection stable
- ✅ JWT authentication secure
- ✅ API endpoints properly documented
- ✅ Error handling comprehensive
- ✅ Mobile responsive design

### **User Experience Requirements:**
- ✅ Intuitive registration flow
- ✅ Clear role-based navigation
- ✅ User-friendly error messages
- ✅ Fast loading times (<2 seconds)
- ✅ Accessible design (basic compliance)

---

## **Phase 1 Deliverables Checklist**

- [ ] Working authentication system dengan role detection
- [ ] Protected routes berdasarkan role (therapist vs parent)
- [ ] Basic UI framework dan responsive layout
- [ ] Child profile CRUD operations
- [ ] User registration/login pages
- [ ] Role-based dashboard routing
- [ ] API documentation untuk auth endpoints
- [ ] Testing documentation dan checklist
- [ ] Phase 1 completion report

---

*Document ini akan di-update secara real-time seiring progress development Phase 1.*