// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

/** Matches API LoginResponse + the outer { success, message, data } wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  fullName: string;
  expiry: string;
  schoolEiin?: string;
}

// ── Shared ────────────────────────────────────────────────────────────────────
export interface DropdownItem { value: number | string; label: string; }

// ── School ────────────────────────────────────────────────────────────────────
export interface SchoolInfo {
  schoolId: number;
  schoolEiin: string;
  schoolName: string;
  schoolType?: string;
  address?: string;
  district?: string;
  thana?: string;
  postCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  principalPhone?: string;
  principalEmail?: string;
  establishedYear?: string;
  authStatus?: string;
}

// ── Class ─────────────────────────────────────────────────────────────────────
export interface EduClass {
  classId: number;
  className: string;
  classCode?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Section ───────────────────────────────────────────────────────────────────
export interface Section {
  sectionId: number;
  classId: number;
  sectionName?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Group ─────────────────────────────────────────────────────────────────────
export interface Group {
  groupId: number;
  classId: number;
  groupName?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Subject ───────────────────────────────────────────────────────────────────
export interface Subject {
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  isPractical?: boolean;
  authStatus?: string;
  schoolEiin?: string;
}

// ── ClassSubject ──────────────────────────────────────────────────────────────
export interface ClassSubject {
  classSubjectId: number;
  classId: number;
  sectionId?: number;
  groupId?: number;
  subjectId: number;
  authStatus?: string;
}

// ── ClassTeacher ──────────────────────────────────────────────────────────────
export interface ClassTeacher {
  classTeacherId: number;
  classId: number;
  sectionId?: number;
  groupId?: number;
  staffId: number;
  authStatus?: string;
}

// ── Staff ─────────────────────────────────────────────────────────────────────
export interface Staff {
  staffId: number;
  userId: number;
  staffRole?: string;
  joinDate?: string;
  salary?: number;
  bankAccount?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Student ───────────────────────────────────────────────────────────────────
export interface Student {
  studentId: number;
  userId?: number;
  admissionNo: string;
  firstName: string;
  lastName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  studentImage?: string;
  fatherImage?: string;
  motherImage?: string;
  classId?: number;
  sectionId?: number;
  groupId?: number;
  enrollmentYear?: string;
  guardianName?: string;
  guardianContact?: string;
  guardianRelation?: string;
  tuitionFee?: number;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────
export interface Attendance {
  attendanceId: number;
  studentId: number;
  attendanceDate: string;
  status: string;
  note?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Exam ──────────────────────────────────────────────────────────────────────
export interface Exam {
  examId: number;
  examName?: string;
  classId?: number;
  sectionId?: number;
  groupId?: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── ExamSubject ───────────────────────────────────────────────────────────────
export interface ExamSubject {
  examSubjectId: number;
  examId: number;
  subjectId: number;
  authStatus?: string;
}

// ── Mark ──────────────────────────────────────────────────────────────────────
export interface Mark {
  markId: number;
  examId: number;
  subjectId: number;
  studentId: number;
  writtenMark?: number;
  classTestMark?: number;
  homeworkMark?: number;
  obtainTotalMark?: number;
  examTotalMark?: number;
  isAbsent?: boolean;
  grade?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Fees Master ───────────────────────────────────────────────────────────────
export interface FeesMaster {
  feeMasterId: number;
  classId?: number;
  sectionId?: number;
  groupId?: number;
  feeType?: string;
  amount?: number;
  applicableYear?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Fee Payment ───────────────────────────────────────────────────────────────
export interface FeePayment {
  paymentId: number;
  studentId: number;
  feeMasterId: number;
  amountPaid?: number;
  discountAmount?: number;
  fineAmount?: number;
  paymentDate?: string;
  status: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Student Fee Due (report) ────────────────────────────────────────────────
export interface StudentFeeDue {
  studentId: number;
  admissionNo: string;
  firstName: string;
  lastName?: string;
  className?: string;
  sectionName?: string;
  totalAssigned: number;
  totalPaid: number;
  totalDue: number;
}

export interface StudentFeeDueDetail {
  feeMasterId: number;
  feeType: string;
  applicableYear?: string;
  assigned: number;
  paid: number;
  discount: number;
  fine: number;
  due: number;
}

// ── Fee Payment Slip / Receipt ──────────────────────────────────────────────
export interface FeePaymentSlip {
  paymentId: number;
  amountPaid: number;
  discountAmount: number;
  fineAmount: number;
  paymentDate: string;
  status: string;

  studentId: number;
  admissionNo: string;
  firstName: string;
  lastName?: string;
  guardianName?: string;
  guardianContact?: string;
  className?: string;
  sectionName?: string;

  feeMasterId: number;
  feeType: string;
  applicableYear?: string;
  feeAmount: number;

  totalPaid: number;
  totalDiscount: number;
  totalFine: number;
  totalDue: number;
  schoolEiin?: string;
}

// ── Fee Advance Adjustment ───────────────────────────────────────────────────
export interface FeeAdjustment {
  adjustmentId: number;
  studentId: number;
  fromFeeMasterId: number;
  fromFeeType: string;
  toFeeMasterId: number;
  toFeeType: string;
  amount: number;
  adjustmentDate: string;
  remarks?: string;
  makeBy?: string;
  makeDate?: string;
}

export interface CreateFeeAdjustment {
  studentId: number;
  fromFeeMasterId: number;
  toFeeMasterId: number;
  amount: number;
  adjustmentDate?: string;
  remarks?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  totalSubjects: number;
  presentToday: number;
  absentToday: number;
  feesCollected: number;
  feesPending: number;
}
