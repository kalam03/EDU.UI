import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy,
  SimpleChanges, forwardRef, HostListener, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: number | string;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SearchableSelectComponent),
    multi: true
  }]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number | string | null>();

  @ViewChild('trigger', { static: false }) triggerRef!: ElementRef;
  @ViewChild('dropdownPanel') dropdownPanelRef?: ElementRef<HTMLElement>;

  isOpen = false;
  dropTop = 0;
  dropLeft = 0;
  dropWidth = 200;
  searchQuery = '';
  filteredOptions: SelectOption[] = [];
  selectedOption: SelectOption | null = null;
  highlightIndex = -1;

  private onChange: (v: number | string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onOutside(e: MouseEvent) {
    const target = e.target as Node;
    const insideHost = this.elRef.nativeElement.contains(target);
    // The panel is portaled to <body> once open (see portalToBody), so it's no longer a
    // descendant of elRef.nativeElement. Without this extra check, every click inside the
    // panel (a search keystroke, an option row) would look like an "outside" click and close it.
    const insideDropdown = !!this.dropdownPanelRef && this.dropdownPanelRef.nativeElement.contains(target);
    if (!insideHost && !insideDropdown) this.close();
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
      this.updatePosition();
      this.searchQuery = '';
      this.filteredOptions = [...this.options];
      this.isOpen = true;
      this.attachRepositionListeners();
      // Wait a tick for *ngIf to create the panel's DOM node, then move it to <body>.
      setTimeout(() => this.portalToBody());
    } else {
      this.close();
    }
  }

  // Moves the dropdown panel out of the form's DOM tree and appends it directly to <body>.
  // The panel is `position: fixed`, so an ancestor further up the form (a card, a section
  // wrapper, anything establishing its own stacking context or a containing block for fixed
  // elements) can otherwise trap it, causing it to render underneath or bleed together with
  // sibling content instead of floating cleanly on top of the whole page. Reparenting to <body>
  // removes every such ancestor from the equation. Angular's change detection and event bindings
  // keep working normally on the moved node; when *ngIf later destroys it, Angular removes it
  // from wherever it currently lives (its actual live parent), so no manual cleanup is needed.
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
  }

  ngOnDestroy(): void { this.detachRepositionListeners(); }

  /// The dropdown panel is `position: fixed` (so it can escape any card's `overflow: hidden`
  /// without being clipped), positioned from the trigger's viewport-relative coordinates. Those
  /// coordinates are only a snapshot from the moment it opened — without this, scrolling the page
  /// (or any scrollable container the trigger sits in) moves the trigger out from under a dropdown
  /// that stays frozen at its original spot. `updatePosition` re-reads the trigger's live position
  /// on every scroll/resize while the dropdown is open so it always stays glued to the control.
  private updatePosition = (): void => {
    if (!this.triggerRef) return;
    const rect = this.triggerRef.nativeElement.getBoundingClientRect();
    this.dropTop = rect.bottom + 2;
    this.dropLeft = rect.left;
    this.dropWidth = rect.width;
  };

  private attachRepositionListeners(): void {
    // capture: true so this also fires for scroll events on any scrollable ancestor (a table
    // wrapper, a modal body, etc.), not just the window itself.
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
    this.highlightIndex = -1;
  }

  selectOption(opt: SelectOption) {
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

  isSelected(opt: SelectOption): boolean {
    return this.selectedOption?.value === opt.value;
  }

  getLabel(opt: SelectOption): string { return opt.label; }

  onKeyDown(e: KeyboardEvent) {
    if (!this.isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        // Route through toggleDropdown() rather than setting isOpen directly, so the keyboard-
        // opened dropdown gets positioned and kept in sync on scroll just like a mouse click does.
        this.toggleDropdown();
        e.preventDefault();
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

  registerOnChange(fn: (v: number | string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
