import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, forwardRef, HostListener, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption {
  value: number | string;
  label: string;
}

@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-dropdown.component.html',
  styleUrls: ['./searchable-dropdown.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SearchableDropdownComponent),
    multi: true
  }]
})
export class SearchableDropdownComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number | string | null>();

  @ViewChild('trigger', { static: false }) triggerRef!: ElementRef;

  isOpen = false;
  dropTop = 0;
  dropLeft = 0;
  dropWidth = 200;
  searchQuery = '';
  filteredOptions: DropdownOption[] = [];
  selectedOption: DropdownOption | null = null;
  highlightIndex = -1;

  private onChange: (v: number | string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onOutside(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) this.close();
  }

  ngOnInit() { this.filteredOptions = [...this.options]; }

  ngOnChanges(c: SimpleChanges) {
    if (c['options']) {
      this.filteredOptions = [...(this.options || [])];
      if (this.selectedOption) {
        const found = this.options.find(o => o.value === this.selectedOption!.value);
        this.selectedOption = found || null;
      }
    }
  }

  toggleDropdown() {
    if (this.disabled) return;
    if (!this.isOpen) {
      const rect = this.triggerRef.nativeElement.getBoundingClientRect();
      this.dropTop = rect.bottom + 2;
      this.dropLeft = rect.left;
      this.dropWidth = rect.width;
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
    }
    this.isOpen = !this.isOpen;
  }

  close() { this.isOpen = false; this.searchQuery = ''; this.filteredOptions = [...this.options]; }

  onSearch() {
    const q = this.searchQuery.toLowerCase();
    this.filteredOptions = this.options.filter(o => o.label.toLowerCase().includes(q));
    this.highlightIndex = -1;
  }

  selectOption(opt: DropdownOption) {
    this.selectedOption = opt;
    this.onChange(opt.value);
    this.onTouched();
    this.valueChange.emit(opt.value);
    this.close();
  }

  clear(e: MouseEvent) {
    e.stopPropagation();
    this.selectedOption = null;
    this.onChange(null);
    this.onTouched();
    this.valueChange.emit(null);
    this.close();
  }

  isSelected(opt: DropdownOption): boolean {
    return this.selectedOption?.value === opt.value;
  }

  getLabel(opt: DropdownOption): string { return opt.label; }

  onKeyDown(e: KeyboardEvent) {
    if (!this.isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        this.isOpen = true; e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightIndex = Math.min(this.highlightIndex + 1, this.filteredOptions.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightIndex = Math.max(this.highlightIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlightIndex >= 0) this.selectOption(this.filteredOptions[this.highlightIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  writeValue(val: number | string | null): void {
    if (val !== null && val !== undefined) {
      const found = this.options.find(o => o.value === val);
      this.selectedOption = found || null;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: any) { this.onChange = fn; }
  registerOnTouched(fn: any) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled = isDisabled; }
}
