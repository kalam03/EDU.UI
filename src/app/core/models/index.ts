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
// Fixed set of options for the Religion dropdown — kept as an enum (rather than free text)
// so values are consistent for reporting/filtering; stored on the backend as the plain string.
export enum Religion {
  Islam = 'Islam',
  Hinduism = 'Hinduism',
  Christianity = 'Christianity',
  Buddhism = 'Buddhism',
  Other = 'Other'
}

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
  guardianAddress?: string;
  tuitionFee?: number;
  fatherCnic?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  fatherEducation?: string;
  motherEducation?: string;
  officeAddress?: string;
  officePhone?: string;
  nationality?: string;
  religion?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── Teacher ───────────────────────────────────────────────────────────────────
export interface Teacher {
  teacherId: number;
  userId?: number;
  employeeNo: string;
  firstName: string;
  lastName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  nidNumber?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  teacherImage?: string;
  designation?: string;
  educationQualification?: string;
  employmentType?: string;
  joiningDate?: string;
  salary?: number;
  bankAccount?: string;
  emergencyContact?: string;
  authStatus?: string;
  schoolEiin?: string;
  /** Populated only by GetById — this teacher's current subject/class/section assignments. */
  assignments?: TeacherSubjectAssignment[];
}

/** One "this teacher teaches Subject X to Class/Section/Group Y" row. */
export interface TeacherSubjectAssignment {
  teacherSubjectId?: number;
  teacherId: number;
  subjectId: number;
  subjectName?: string;
  classId: number;
  sectionId?: number | null;
  groupId?: number | null;
  teacherName?: string;
  schoolEiin?: string;
}

// ── Class Routine ─────────────────────────────────────────────────────────────
export const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export interface ClassRoutine {
  classRoutineId: number;
  classId: number;
  sectionId?: number | null;
  groupId?: number | null;
  dayOfWeek: string;
  periodNo: number;
  startTime?: string;
  endTime?: string;
  subjectId: number;
  teacherId?: number | null;
  roomNo?: string;
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
  shiftName?: string;
  authStatus?: string;
  schoolEiin?: string;
}

// ── ExamSubject ───────────────────────────────────────────────────────────────
export interface ExamSubject {
  examSubjectId: number;
  examId: number;
  subjectId: number;
  classId?: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  roomNote?: string;
  authStatus?: string;
  schoolEiin?: string;
}

/** One printable/on-screen row of an exam routine — an ExamSubject slot joined with its
 *  Exam/Class/Subject names (see GET /api/examsubjects/routine/{examId}). */
export interface ExamRoutineRow {
  examSubjectId: number;
  examId: number;
  examName: string;
  classId?: number;
  className?: string;
  subjectId: number;
  subjectName?: string;
  subjectCode?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  roomNote?: string;
  authStatus?: string;
  schoolEiin?: string;
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

// ── Student Promotion ────────────────────────────────────────────────────────
export interface PromoteStudentsRequest {
  studentIds: number[];
  toClassId: number;
  toSectionId?: number | null;
  toGroupId?: number | null;
  enrollmentYear?: string;
}

export interface PromoteStudentsResult {
  promotedCount: number;
}

// ── Library: Book ─────────────────────────────────────────────────────────────
export interface LibraryBook {
  bookId: number;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  schoolEiin?: string;
}

/** Catalog row with copy-count availability. */
export interface LibraryBookCatalog {
  bookId: number;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  totalCopies: number;
  availableCopies: number;
}

// ── Library: Book Copy ────────────────────────────────────────────────────────
export interface LibraryBookCopy {
  copyId: number;
  bookId: number;
  barcode: string;
  status: string;
  schoolEiin?: string;
}

/** An available copy, joined with its book title, for the Issue Book picker. */
export interface AvailableLibraryBookCopy {
  copyId: number;
  bookId: number;
  bookTitle: string;
  barcode: string;
  status: string;
}

// ── Library: Issue / Return ───────────────────────────────────────────────────
export interface LibraryBookIssue {
  issueId: number;
  copyId: number;
  barcode: string;
  bookId: number;
  bookTitle: string;
  studentId: number;
  admissionNo: string;
  firstName: string;
  lastName?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  finePaid: boolean;
  finePaidDate?: string;
  status: string;
  isOverdue: boolean;
}

export interface OverdueLibraryBookIssue {
  issueId: number;
  copyId: number;
  barcode: string;
  bookId: number;
  bookTitle: string;
  studentId: number;
  admissionNo: string;
  firstName: string;
  lastName?: string;
  issueDate: string;
  dueDate: string;
  fineAmount: number;
  finePaid: boolean;
  status: string;
  daysOverdue: number;
}

export interface IssueLibraryBookRequest {
  copyId: number;
  studentId: number;
  issueDate?: string;
  dueDate?: string;
}

export interface ReturnLibraryBookRequest {
  returnDate?: string;
  finePerDay?: number;
  markLost?: boolean;
}

export interface ReturnLibraryBookResult {
  issueId: number;
  status: string;
  returnDate?: string;
  fineAmount: number;
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
