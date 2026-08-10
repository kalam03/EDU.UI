import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    //canActivate: [loginGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    //canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/students-list/students-list.component').then(m => m.StudentsListComponent)
      },
      {
        path: 'students/new',
        loadComponent: () => import('./features/students/students-form/students-form.component').then(m => m.StudentsFormComponent)
      },
      {
        path: 'students/promotion',
        loadComponent: () => import('./features/students/students-promotion/students-promotion.component').then(m => m.StudentsPromotionComponent)
      },
      {
        path: 'students/:id/edit',
        loadComponent: () => import('./features/students/students-form/students-form.component').then(m => m.StudentsFormComponent)
      },
      {
        path: 'students/:id/admission-form',
        loadComponent: () => import('./features/students/students-admission-form/students-admission-form.component').then(m => m.StudentsAdmissionFormComponent)
      },
      {
        path: 'students/:id',
        loadComponent: () => import('./features/students/students-detail/students-detail.component').then(m => m.StudentsDetailComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/staff-list/staff-list.component').then(m => m.StaffListComponent)
      },
      {
        path: 'staff/new',
        loadComponent: () => import('./features/staff/staff-form/staff-form.component').then(m => m.StaffFormComponent)
      },
      {
        path: 'staff/:id/edit',
        loadComponent: () => import('./features/staff/staff-form/staff-form.component').then(m => m.StaffFormComponent)
      },
      {
        path: 'teachers',
        loadComponent: () => import('./features/teachers/teacher-list/teacher-list.component').then(m => m.TeacherListComponent)
      },
      {
        path: 'teachers/new',
        loadComponent: () => import('./features/teachers/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent)
      },
      {
        path: 'teachers/:id/edit',
        loadComponent: () => import('./features/teachers/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent)
      },
      {
        path: 'teachers/:id',
        loadComponent: () => import('./features/teachers/teacher-detail/teacher-detail.component').then(m => m.TeacherDetailComponent)
      },
      {
        path: 'class-routine',
        loadComponent: () => import('./features/class-routine/class-routine.component').then(m => m.ClassRoutineComponent)
      },
      {
        path: 'classes',
        loadComponent: () => import('./features/classes/classes-list/classes-list.component').then(m => m.ClassesListComponent)
      },
      {
        path: 'classes/new',
        loadComponent: () => import('./features/classes/classes-form/classes-form.component').then(m => m.ClassesFormComponent)
      },
      {
        path: 'classes/:id/edit',
        loadComponent: () => import('./features/classes/classes-form/classes-form.component').then(m => m.ClassesFormComponent)
      },
      {
        path: 'sections',
        loadComponent: () => import('./features/sections/sections-list/sections-list.component').then(m => m.SectionsListComponent)
      },
      {
        path: 'sections/new',
        loadComponent: () => import('./features/sections/sections-form/sections-form.component').then(m => m.SectionsFormComponent)
      },
      {
        path: 'sections/:id/edit',
        loadComponent: () => import('./features/sections/sections-form/sections-form.component').then(m => m.SectionsFormComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/groups/groups-list/groups-list.component').then(m => m.GroupsListComponent)
      },
      {
        path: 'groups/new',
        loadComponent: () => import('./features/groups/groups-form/groups-form.component').then(m => m.GroupsFormComponent)
      },
      {
        path: 'groups/:id/edit',
        loadComponent: () => import('./features/groups/groups-form/groups-form.component').then(m => m.GroupsFormComponent)
      },
      {
        path: 'subjects',
        loadComponent: () => import('./features/subjects/subjects-list/subjects-list.component').then(m => m.SubjectsListComponent)
      },
      {
        path: 'subjects/new',
        loadComponent: () => import('./features/subjects/subjects-form/subjects-form.component').then(m => m.SubjectsFormComponent)
      },
      {
        path: 'subjects/:id/edit',
        loadComponent: () => import('./features/subjects/subjects-form/subjects-form.component').then(m => m.SubjectsFormComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent)
      },
      {
        path: 'attendance/new',
        loadComponent: () => import('./features/attendance/attendance-form/attendance-form.component').then(m => m.AttendanceFormComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./features/exams/exams-list/exams-list.component').then(m => m.ExamsListComponent)
      },
      {
        path: 'exams/new',
        loadComponent: () => import('./features/exams/exams-form/exams-form.component').then(m => m.ExamsFormComponent)
      },
      {
        path: 'exams/:id/edit',
        loadComponent: () => import('./features/exams/exams-form/exams-form.component').then(m => m.ExamsFormComponent)
      },
      {
        path: 'exams/routine',
        loadComponent: () => import('./features/exams/exam-routine/exam-routine.component').then(m => m.ExamRoutineComponent)
      },
      {
        path: 'marks',
        loadComponent: () => import('./features/marks/marks-list/marks-list.component').then(m => m.MarksListComponent)
      },
      {
        path: 'marks/new',
        loadComponent: () => import('./features/marks/marks-form/marks-form.component').then(m => m.MarksFormComponent)
      },
      {
        path: 'marks/:id/details',
        loadComponent: () => import('./features/marks/marks-details/marks-details.component').then(m => m.MarksDetailsComponent)
      },
      {
        path: 'marks/:id/edit',
        loadComponent: () => import('./features/marks/marks-form/marks-form.component').then(m => m.MarksFormComponent)
      },
      {
        path: 'fees',
        loadComponent: () => import('./features/fees/fees-list/fees-list.component').then(m => m.FeesListComponent)
      },
      {
        path: 'fees/new',
        loadComponent: () => import('./features/fees/fees-form/fees-form.component').then(m => m.FeesFormComponent)
      },
      {
        path: 'fees/:id/edit',
        loadComponent: () => import('./features/fees/fees-form/fees-form.component').then(m => m.FeesFormComponent)
      },
      {
        path: 'fees/:id/slip',
        loadComponent: () => import('./features/fees/fee-slip/fee-slip.component').then(m => m.FeeSlipComponent)
      },
      {
        path: 'fees/dues',
        loadComponent: () => import('./features/fees/fee-dues/fee-dues.component').then(m => m.FeeDuesComponent)
      },
      {
        path: 'fee-types',
        loadComponent: () => import('./features/fees/fees-master-list/fees-master-list.component').then(m => m.FeesMasterListComponent)
      },
      {
        path: 'fee-types/new',
        loadComponent: () => import('./features/fees/fees-master-form/fees-master-form.component').then(m => m.FeesMasterFormComponent)
      },
      {
        path: 'fee-types/:id/edit',
        loadComponent: () => import('./features/fees/fees-master-form/fees-master-form.component').then(m => m.FeesMasterFormComponent)
      },
      {
        path: 'library/books',
        loadComponent: () => import('./features/library/books-list/books-list.component').then(m => m.BooksListComponent)
      },
      {
        path: 'library/books/new',
        loadComponent: () => import('./features/library/books-form/books-form.component').then(m => m.BooksFormComponent)
      },
      {
        path: 'library/books/:id/edit',
        loadComponent: () => import('./features/library/books-form/books-form.component').then(m => m.BooksFormComponent)
      },
      {
        path: 'library/books/:bookId/copies',
        loadComponent: () => import('./features/library/book-copies/book-copies.component').then(m => m.BookCopiesComponent)
      },
      {
        path: 'library/issues',
        loadComponent: () => import('./features/library/issues-list/issues-list.component').then(m => m.IssuesListComponent)
      },
      {
        path: 'library/issues/new',
        loadComponent: () => import('./features/library/issue-form/issue-form.component').then(m => m.IssueFormComponent)
      },
      {
        path: 'school-info',
        loadComponent: () => import('./features/school-info/school-info.component').then(m => m.SchoolInfoComponent)
      },
      {
        path: 'marksheet',
        loadComponent: () => import('./features/marksheet/marksheet.component').then(m => m.MarksheetComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }];
