import {
  Component, Input, forwardRef, HostListener, ElementRef, OnInit, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-datepicker.component.html',
  styleUrls: ['./custom-datepicker.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CustomDatepickerComponent), multi: true }]
})
export class CustomDatepickerComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder = 'DD/MM/YYYY';
  @Input() disabled = false;

  @ViewChild('inputRow', { static: false }) inputRowRef!: ElementRef;

  isOpen = false;
  calTop = 0;
  calLeft = 0;
  calWidth = 272;
  selectedDate: Date | null = null;
  currentMonth: Date = new Date();
  calendarDays: (Date | null)[] = [];
  inputValue = '';

  monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  private onChange: (val: any) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  ngOnInit() { this.buildCalendar(); }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) this.isOpen = false;
  }

  onInputChange(raw: string): void {
    const formatted = this.autoFormat(raw);
    this.inputValue = formatted;
    const parsed = this.parseFormatted(formatted);
    if (parsed) {
      this.selectedDate = parsed;
      this.currentMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      this.buildCalendar();
      this.onChange(this.toISO(parsed));
    } else {
      this.onChange('');
    }
  }

  onInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Backspace') {
      const input = e.target as HTMLInputElement;
      const pos = input.selectionStart ?? 0;
      const val = this.inputValue;
      if (val[pos - 1] === '/') {
        e.preventDefault();
        const newVal = val.slice(0, pos - 2) + val.slice(pos);
        this.inputValue = newVal;
        this.onInputChange(newVal);
        setTimeout(() => input.setSelectionRange(pos - 2, pos - 2));
      }
    }
  }

  autoFormat(raw: string): string {
    let d = raw.replace(/\D/g, '');
    if (d.length >= 2) d = d.slice(0, 2) + '/' + d.slice(2);
    if (d.length >= 5) d = d.slice(0, 5) + '/' + d.slice(5, 9);
    return d.slice(0, 10);
  }

  parseFormatted(s: string): Date | null {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const dt = new Date(+m[3], +m[2] - 1, +m[1]);
    return (dt instanceof Date && !isNaN(dt.getTime())) ? dt : null;
  }

  toISO(d: Date): string {
    const y = d.getFullYear();
    const mo = ('0' + (d.getMonth() + 1)).slice(-2);
    const dy = ('0' + d.getDate()).slice(-2);
    return y + '-' + mo + '-' + dy;
  }

  formatDay(d: Date): string {
    const dy = ('0' + d.getDate()).slice(-2);
    const mo = ('0' + (d.getMonth() + 1)).slice(-2);
    return dy + '/' + mo + '/' + d.getFullYear();
  }

  openCalendar(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled) return;
    const rect = this.inputRowRef.nativeElement.getBoundingClientRect();
    this.calTop = rect.bottom + 4;
    this.calLeft = rect.left;
    this.calWidth = Math.max(rect.width, 272);
    this.isOpen = true;
    this.buildCalendar();
  }

  buildCalendar() {
    const y = this.currentMonth.getFullYear();
    const mo = this.currentMonth.getMonth();
    const firstDay = new Date(y, mo, 1).getDay();
    const days = new Date(y, mo + 1, 0).getDate();
    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) this.calendarDays.push(null);
    for (let d = 1; d <= days; d++) this.calendarDays.push(new Date(y, mo, d));
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDay(day: Date | null) {
    if (!day) return;
    this.selectedDate = day;
    this.inputValue = this.formatDay(day);
    this.onChange(this.toISO(day));
    this.onTouched();
    this.isOpen = false;
  }

  selectToday() { this.selectDay(new Date()); }

  clear(e: MouseEvent) {
    e.stopPropagation();
    this.selectedDate = null;
    this.inputValue = '';
    this.onChange(null);
    this.onTouched();
  }

  isSelected(day: Date | null): boolean {
    return !!day && !!this.selectedDate && day.toDateString() === this.selectedDate.toDateString();
  }

  isToday(day: Date | null): boolean {
    return !!day && day.toDateString() === new Date().toDateString();
  }

  get monthLabel(): string {
    return this.monthNames[this.currentMonth.getMonth()] + ' ' + this.currentMonth.getFullYear();
  }

  writeValue(val: any) {
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        this.selectedDate = d;
        this.inputValue = this.formatDay(d);
        this.currentMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        this.buildCalendar();
      }
    } else {
      this.selectedDate = null;
      this.inputValue = '';
    }
  }

  registerOnChange(fn: any) { this.onChange = fn; }
  registerOnTouched(fn: any) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled = isDisabled; }
}
