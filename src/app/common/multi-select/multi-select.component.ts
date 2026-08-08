import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy,
  SimpleChanges, forwardRef, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOption } from '../searchable-select/searchable-select.component';

/**
 * Multi-value counterpart to app-searchable-select — a dropdown checklist with search, and the
 * currently-selected options shown as removable chips on the trigger. Built for cases like
 * "assign one or more teachers to invigilate an exam" where a single-value select isn't enough.
 *
 * Shares the same portal-to-<body> + capture-phase-outside-click techniques as
 * SearchableSelectComponent (see that file for the full rationale) so it behaves identically
 * inside popups/modals.
 */
@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultiSelectComponent),
    multi: true
  }]
})
export class MultiSelectComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<(number | string)[]>();

  @ViewChild('trigger', { static: false }) triggerRef!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanelRef?: ElementRef<HTMLElement>;

  isOpen = false;
  dropTop = 0;
  dropLeft = 0;
  dropWidth = 200;
  searchQuery = '';
  filteredOptions: SelectOption[] = [];
  selectedValues: (number | string)[] = [];

  private onChange: (v: (number | string)[]) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  private readonly boundOnOutside = (e: MouseEvent) => this.onOutside(e);

  onOutside(e: MouseEvent) {
    if (!this.isOpen) return;
    const target = e.target as Node;
    const insideHost = this.elRef.nativeElement.contains(target);
    const insideDropdown = !!this.dropdownPanelRef && this.dropdownPanelRef.nativeElement.contains(target);
    if (!insideHost && !insideDropdown) this.close();
  }

  ngOnInit() {
    this.filteredOptions = [...this.options];
    // Capture phase — see SearchableSelectComponent for the full explanation. Makes "click
    // anywhere to close" work even when this component is opened inside a popup/modal that has
    // its own click handling.
    document.addEventListener('click', this.boundOnOutside, true);
  }

  ngOnChanges(c: SimpleChanges) {
    if (c['options']) {
      this.filteredOptions = [...(this.options || [])];
    }
  }

  ngOnDestroy(): void {
    this.detachRepositionListeners();
    document.removeEventListener('click', this.boundOnOutside, true);
  }

  get selectedOptions(): SelectOption[] {
    return this.options.filter(o => this.selectedValues.includes(o.value));
  }

  toggleDropdown() {
    if (this.disabled) return;
    if (!this.isOpen) {
      this.updatePosition();
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
      this.isOpen = true;
      this.attachRepositionListeners();
      setTimeout(() => this.portalToBody());
    } else {
      this.close();
    }
  }

  private portalToBody(): void {
    const panel = this.dropdownPanelRef?.nativeElement;
    if (panel && panel.parentElement !== document.body) {
      document.body.appendChild(panel);
      this.updatePosition();
    }
  }

  close() {
    this.isOpen = false;
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.detachRepositionListeners();
    this.onTouched();
  }

  private updatePosition = (): void => {
    if (!this.triggerRef) return;
    const rect = this.triggerRef.nativeElement.getBoundingClientRect();
    this.dropTop = rect.bottom + 2;
    this.dropLeft = rect.left;
    this.dropWidth = Math.max(rect.width, 220);
  };

  private attachRepositionListeners(): void {
    window.addEventListener('scroll', this.updatePosition, true);
    window.addEventListener('resize', this.updatePosition);
  }

  private detachRepositionListeners(): void {
    window.removeEventListener('scroll', this.updatePosition, true);
    window.removeEventListener('resize', this.updatePosition);
  }

  onSearch() {
    const q = this.searchQuery.toLowerCase();
    this.filteredOptions = this.options.filter(o => o.label.toLowerCase().includes(q));
  }

  isSelected(opt: SelectOption): boolean {
    return this.selectedValues.includes(opt.value);
  }

  toggleOption(opt: SelectOption): void {
    this.selectedValues = this.isSelected(opt)
      ? this.selectedValues.filter(v => v !== opt.value)
      : [...this.selectedValues, opt.value];
    this.emitChange();
  }

  removeChip(value: number | string, e: MouseEvent): void {
    e.stopPropagation();
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.emitChange();
  }

  /** Keyboard access on the trigger — Enter/Space/ArrowDown opens, Escape closes, matching
   *  SearchableSelectComponent's keyboard support. */
  onKeyDown(e: KeyboardEvent): void {
    if (!this.isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        this.toggleDropdown();
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  private emitChange(): void {
    this.onChange(this.selectedValues);
    this.onTouched();
    this.valueChange.emit(this.selectedValues);
  }

  writeValue(val: (number | string)[] | null): void {
    this.selectedValues = Array.isArray(val) ? [...val] : [];
  }

  registerOnChange(fn: (v: (number | string)[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
