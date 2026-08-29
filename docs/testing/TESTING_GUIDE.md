# Hearty Bridge - Comprehensive Testing Guide

**Document Version:** 1.0  
**Last Updated:** December 13, 2024  
**Purpose:** Manual testing procedures untuk setiap phase development

---

## **Testing Overview**

### **Testing Strategy:**
- **Manual Testing:** User-focused testing untuk functionality validation
- **Regression Testing:** Ensure existing features tetap bekerja
- **Cross-browser Testing:** Compatibility across different browsers
- **Mobile Testing:** Responsive design validation
- **User Acceptance Testing:** Real user scenario validation

### **Testing Environments:**
- **Development:** Local development server (http://localhost:3000)
- **Staging:** TBD
- **Production:** TBD

---

## **Phase 1 Testing Guide**

### **Pre-Testing Setup**
#### **Required Test Data:**
- **Test Therapist Account:**
  - Email: therapist1@test.com
  - Password: TestPass123!
  - Name: Dr. Sarah Wilson
  - Specialization: Child Development

- **Test Parent Account:**
  - Email: parent1@test.com
  - Password: TestPass123!
  - Name: John Smith

- **Test Children:**
  - Child 1: Emma Smith (5 years old, female)
  - Child 2: Lucas Smith (8 years old, male)

#### **Testing Environment Setup:**
1. Ensure MongoDB is running
2. Clear test database sebelum testing
3. Run seeder untuk create initial test data
4. Verify server running pada localhost:3000

---

### **Test Suite 1: Authentication System**

#### **TS1.1: User Registration - Therapist**
**Priority:** High  
**Estimated Time:** 5 minutes

**Test Steps:**
1. Navigate to `/register`
2. Select "Therapist" role
3. Fill form dengan data:
   - Name: "Dr. Test Therapist"
   - Email: "therapist.test@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
   - Phone: "+62812345678"
   - Specialization: "Child Psychology"
   - Clinic: "Test Clinic"
4. Click "Register" button
5. Wait for registration process

**Expected Results:**
- ✅ Registration form submits successfully
- ✅ Success message displayed
- ✅ Automatic redirect ke therapist dashboard
- ✅ User logged in automatically
- ✅ Therapist navigation menu visible

**Failure Indicators:**
- ❌ Form validation errors
- ❌ Server error responses
- ❌ No redirect after registration
- ❌ Wrong dashboard type displayed

---

#### **TS1.2: User Registration - Parent**
**Priority:** High  
**Estimated Time:** 5 minutes

**Test Steps:**
1. Navigate to `/register`
2. Select "Parent" role
3. Fill form dengan data:
   - Name: "Test Parent"
   - Email: "parent.test@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
   - Phone: "+62812345679"
4. Click "Register" button
5. Wait for registration process

**Expected Results:**
- ✅ Registration form submits successfully
- ✅ Success message displayed
- ✅ Automatic redirect ke parent dashboard
- ✅ User logged in automatically
- ✅ Parent navigation menu visible

---

#### **TS1.3: User Login**
**Priority:** High  
**Estimated Time:** 3 minutes

**Test Steps:**
1. Navigate to `/login`
2. Enter email: "therapist.test@example.com"
3. Enter password: "SecurePass123!"
4. Click "Login" button
5. Observe redirect behavior

**Expected Results:**
- ✅ Login form submits successfully
- ✅ Redirect ke appropriate dashboard based on role
- ✅ User session established
- ✅ Navigation shows logged-in state
- ✅ Profile information accessible

**Variations:**
- Test dengan parent account
- Test "Remember me" checkbox
- Test dengan invalid credentials

---

#### **TS1.4: Form Validation Testing**
**Priority:** High  
**Estimated Time:** 10 minutes

**Test Cases:**
1. **Empty Form Submission:**
   - Submit registration form kosong
   - Verify all required field errors displayed

2. **Email Validation:**
   - Enter invalid email formats: "test", "test@", "@example.com"
   - Verify email validation errors

3. **Password Strength:**
   - Enter weak passwords: "123", "password"
   - Verify password strength requirements

4. **Password Confirmation:**
   - Enter different passwords in password dan confirm fields
   - Verify mismatch error displayed

5. **Phone Number Format:**
   - Enter invalid phone formats
   - Verify phone validation (if implemented)

**Expected Results:**
- ✅ All validation errors display dengan clear messages
- ✅ Form prevents submission dengan invalid data
- ✅ Real-time validation feedback
- ✅ Error messages hilang ketika fixed

---

### **Test Suite 2: Role-Based Access Control**

#### **TS2.1: Therapist Access Control**
**Priority:** High  
**Estimated Time:** 8 minutes

**Test Steps:**
1. Login sebagai therapist
2. Navigate ke `/dashboard/therapist` - Should allow access
3. Try navigate ke `/dashboard/parent` - Should block access
4. Verify navigation menu items appropriate untuk therapist
5. Test access ke child management features
6. Verify therapist-specific data visibility

**Expected Results:**
- ✅ Therapist dashboard accessible
- ✅ Parent dashboard blocked (redirect or 403)
- ✅ Navigation shows therapist-specific items
- ✅ Can view assigned children
- ✅ Can access assessment tools

---

#### **TS2.2: Parent Access Control**
**Priority:** High  
**Estimated Time:** 8 minutes

**Test Steps:**
1. Login sebagai parent
2. Navigate ke `/dashboard/parent` - Should allow access
3. Try navigate ke `/dashboard/therapist` - Should block access
4. Verify navigation menu appropriate untuk parent
5. Test access ke own children only
6. Verify cannot access other children's data

**Expected Results:**
- ✅ Parent dashboard accessible
- ✅ Therapist dashboard blocked
- ✅ Navigation shows parent-specific items
- ✅ Can view own children only
- ✅ Cannot access admin functions

---

#### **TS2.3: Protected Routes**
**Priority:** High  
**Estimated Time:** 5 minutes

**Test Steps:**
1. Logout completely
2. Try accessing protected routes directly:
   - `/dashboard/therapist`
   - `/dashboard/parent`
   - `/children`
   - `/profile`
3. Verify redirect behavior

**Expected Results:**
- ✅ All protected routes redirect ke login
- ✅ After login, redirect ke originally requested page
- ✅ Session persistence works correctly

---

### **Test Suite 3: Child Profile Management**

#### **TS3.1: Child Creation - Parent**
**Priority:** High  
**Estimated Time:** 7 minutes

**Test Steps:**
1. Login sebagai parent
2. Navigate to children management section
3. Click "Add New Child" atau similar
4. Fill child information form:
   - Name: "Test Child"
   - Date of Birth: "2019-05-15" (untuk child berusia ~5 tahun)
   - Gender: "Female"
   - Medical conditions: "No known conditions"
   - Allergies: "None"
5. Submit form
6. Verify child appears dalam children list

**Expected Results:**
- ✅ Child creation form accessible
- ✅ Form validation works correctly
- ✅ Child successfully created
- ✅ Child appears dalam parent's children list
- ✅ Age calculated correctly
- ✅ All entered data preserved

---

#### **TS3.2: Child Profile Editing**
**Priority:** Medium  
**Estimated Time:** 5 minutes

**Test Steps:**
1. From children list, click edit pada existing child
2. Modify several fields
3. Save changes
4. Verify changes reflected dalam profile
5. Check changes persist after page refresh

**Expected Results:**
- ✅ Edit form pre-populated dengan existing data
- ✅ Changes save successfully
- ✅ Updated data displayed correctly
- ✅ Changes persist across sessions

---

#### **TS3.3: Child Data Visibility - Therapist**
**Priority:** Medium  
**Estimated Time:** 5 minutes

**Test Steps:**
1. Login sebagai therapist
2. Navigate to children section
3. Verify can see assigned children
4. Check cannot see unassigned children
5. Test search/filter functionality

**Expected Results:**
- ✅ Shows only assigned children
- ✅ Search functionality works
- ✅ Cannot access other therapist's children
- ✅ Child details accessible untuk assigned children

---

### **Test Suite 4: User Interface & User Experience**

#### **TS4.1: Responsive Design Testing**
**Priority:** Medium  
**Estimated Time:** 15 minutes

**Device Testing:**
1. **Mobile Portrait (360x640):**
   - Test registration flow
   - Test login flow
   - Test navigation menu (hamburger)
   - Test forms usability
   - Test dashboard layout

2. **Mobile Landscape (640x360):**
   - Test key user flows
   - Verify content tidak terpotong

3. **Tablet (768x1024):**
   - Test layout adaptability
   - Verify optimal use of space

4. **Desktop (1920x1080):**
   - Test full feature accessibility
   - Verify layout optimal

**Expected Results:**
- ✅ All layouts responsive dan functional
- ✅ Navigation accessible pada semua devices
- ✅ Forms usable dengan touch interfaces
- ✅ No horizontal scrolling required
- ✅ Text readable tanpa zooming

---

#### **TS4.2: Loading States & Error Handling**
**Priority:** Medium  
**Estimated Time:** 10 minutes

**Test Scenarios:**
1. **Slow Network Simulation:**
   - Test registration dengan slow connection
   - Verify loading indicators displayed
   - Test timeout handling

2. **Network Error Simulation:**
   - Disconnect network during form submission
   - Verify graceful error handling
   - Test retry functionality

3. **Invalid API Responses:**
   - Test error message display
   - Verify user can recover dari errors

**Expected Results:**
- ✅ Loading states clearly indicated
- ✅ Error messages user-friendly
- ✅ Users can retry failed operations
- ✅ No data loss during errors

---

### **Test Suite 5: Data Integrity & Security**

#### **TS5.1: Data Validation**
**Priority:** High  
**Estimated Time:** 10 minutes

**Test Cases:**
1. **SQL Injection Attempts:**
   - Enter SQL injection strings dalam forms
   - Verify data sanitization

2. **Cross-Site Scripting (XSS):**
   - Enter script tags dalam text fields
   - Verify proper escaping

3. **Data Format Validation:**
   - Test date ranges untuk child birth dates
   - Test email format enforcement
   - Test phone number validation

**Expected Results:**
- ✅ No malicious scripts executed
- ✅ Data properly sanitized
- ✅ Validation prevents invalid data entry

---

#### **TS5.2: Session Management**
**Priority:** High  
**Estimated Time:** 8 minutes

**Test Steps:**
1. Login dan note session duration
2. Test automatic logout after inactivity
3. Test session persistence across browser restarts
4. Test concurrent login sessions
5. Verify logout clears all session data

**Expected Results:**
- ✅ Sessions timeout appropriately
- ✅ Session data properly cleared on logout
- ✅ No sensitive data retained dalam browser
- ✅ Concurrent sessions handled properly

---

## **Cross-Browser Testing Checklist**

### **Supported Browsers:**
- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)

### **Testing Focus:**
- Core user flows (registration, login, child management)
- Form functionality
- CSS layout consistency
- JavaScript functionality

---

## **Performance Testing Guidelines**

### **Page Load Performance:**
**Targets:**
- Initial page load: <3 seconds
- Navigation between pages: <1 second
- Form submissions: <2 seconds
- Image loading: <2 seconds

### **Testing Methods:**
1. Use browser DevTools Network tab
2. Test dengan slow 3G connection
3. Measure Time to First Contentful Paint (FCP)
4. Measure Time to Interactive (TTI)

---

## **Test Execution Tracking**

### **Test Run Template:**
```
## Test Execution - [Date]
**Tester:** [Name]
**Environment:** [Development/Staging/Production]
**Browser:** [Chrome/Firefox/Safari/Edge]
**Device:** [Desktop/Mobile/Tablet]

### Test Results:
- TS1.1: ✅ PASS / ❌ FAIL - [Notes]
- TS1.2: ✅ PASS / ❌ FAIL - [Notes]
- [Continue untuk all test cases]

### Issues Found:
1. [Issue description] - Priority: [High/Medium/Low]
2. [Issue description] - Priority: [High/Medium/Low]

### Overall Assessment:
[Summary of test session]
```

---

## **Bug Reporting Template**

### **Bug Report Format:**
```
**Bug ID:** HB-[Number]
**Title:** [Brief description]
**Priority:** [Critical/High/Medium/Low]
**Severity:** [Critical/Major/Minor/Trivial]

**Environment:**
- Browser: [Name dan version]
- OS: [Operating system]
- Device: [Desktop/Mobile/Tablet]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Videos:**
[Attach if applicable]

**Additional Notes:**
[Any other relevant information]
```

---

## **Testing Schedule Template**

### **Phase 1 Testing Timeline:**
- **Week 1, Day 6:** Authentication system testing
- **Week 2, Day 2:** Role-based access testing
- **Week 2, Day 4:** Child management testing
- **Week 2, Day 6:** UI/UX testing
- **Week 2, Day 7:** Integration testing

### **Sign-off Criteria:**
Phase 1 considered complete ketika:
- ✅ All critical test cases pass
- ✅ No high-priority bugs outstanding
- ✅ Performance targets met
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness confirmed

---

*Document ini akan di-update dengan additional test cases seiring development progress pada phases selanjutnya.*