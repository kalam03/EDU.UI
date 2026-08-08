import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StudentService } from '../../../core/services/student.service';
import { ClassService } from '../../../core/services/class.service';
import { SectionService } from '../../../core/services/section.service';
import { GroupService } from '../../../core/services/group.service';
import { SchoolInfoService } from '../../../core/services/school-info.service';
import { AuthService } from '../../../core/services/auth.service';
import { Student, SchoolInfo } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-students-admission-form',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './students-admission-form.component.html',
  styleUrl: './students-admission-form.component.scss'
})
export class StudentsAdmissionFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private sectionService = inject(SectionService);
  private groupService = inject(GroupService);
  private schoolInfoService = inject(SchoolInfoService);
  private authService = inject(AuthService);

  student: Student | null = null;
  school: SchoolInfo | null = null;
  loading = true;
  error = '';

  className = '—';
  sectionName = '—';
  groupName = '—';

  studentImageUrl: string | null = null;

  pdfGenerating = false;
  pdfError = '';

  get sessionLabel(): string {
    const y = parseInt(this.student?.enrollmentYear ?? '', 10);
    return isNaN(y) ? (this.student?.enrollmentYear ?? '—') : `${y}-${y + 1}`;
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;

    // Cache-first — normally reads straight from localStorage (populated at login); only hits
    // the API if this browser/session never cached this school's info yet.
    this.schoolInfoService.ensureCached(this.authService.schoolEiin).subscribe({
      next: s => this.school = s,
      error: () => {}
    });

    this.studentService.fetch(id).subscribe({
      next: s => {
        this.student = s;
        this.loading = false;
        this.resolveImage(s);
        this.resolveNames(s);
      },
      error: () => { this.loading = false; this.error = 'Failed to load student.'; }
    });
  }

  private resolveImage(s: Student): void {
    const base = environment.apiUrl.replace('/api', '');
    this.studentImageUrl = s.studentImage ? `${base}/${s.studentImage}` : null;
  }

  private resolveNames(s: Student): void {
    if (s.classId) {
      this.classService.list().subscribe(list => {
        this.className = list.find(c => c.classId === s.classId)?.className ?? '—';
      });
    }
    if (s.sectionId) {
      this.sectionService.list().subscribe(list => {
        this.sectionName = list.find(x => x.sectionId === s.sectionId)?.sectionName ?? '—';
      });
    }
    if (s.groupId) {
      this.groupService.list().subscribe(list => {
        this.groupName = list.find(x => x.groupId === s.groupId)?.groupName ?? '—';
      });
    }
  }

  print(): void { window.print(); }

  // The PDF is rendered server-side (QuestPDF) from the same data the student record holds — this
  // keeps one source of truth for the layout instead of duplicating it in client-side PDF code.
  downloadPdf(): void {
    if (!this.student || this.pdfGenerating) return;
    this.pdfGenerating = true;
    this.pdfError = '';
    this.studentService.getAdmissionFormPdf(this.student.studentId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Admission-Form-${this.student!.admissionNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.pdfGenerating = false;
      },
      error: err => {
        // Since the request is made with responseType: 'blob', an error response (the API's
        // JSON { message, errors: [...] } body) arrives as an unparsed Blob in err.error rather
        // than a plain object — read it as text so the real server-side reason is shown instead
        // of a generic message.
        this.pdfGenerating = false;
        this.extractErrorMessage(err).then(msg => {
          this.pdfError = msg ?? 'Could not generate the PDF right now. You can still use Print → Save as PDF.';
        });
      }
    });
  }

  private async extractErrorMessage(err: any): Promise<string | null> {
    try {
      const rawBlob: Blob | undefined = err?.error instanceof Blob ? err.error : undefined;
      const text = rawBlob ? await rawBlob.text() : (typeof err?.error === 'string' ? err.error : null);
      if (!text) return null;
      const parsed = JSON.parse(text);
      const detail = Array.isArray(parsed?.errors) && parsed.errors.length ? parsed.errors.join(' ') : null;
      return [parsed?.message, detail].filter(Boolean).join(' — ') || null;
    } catch {
      return null;
    }
  }
}
