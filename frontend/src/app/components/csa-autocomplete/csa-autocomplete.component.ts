import {
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { CsaOption } from '../../models/csa.model';

@Component({
  selector: 'app-csa-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './csa-autocomplete.component.html',
  styleUrl: './csa-autocomplete.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CsaAutocompleteComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CsaAutocompleteComponent),
      multi: true
    }
  ]
})
export class CsaAutocompleteComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() placeholder = 'Digite região ou comunidade...';
  @Input() inputId = '';
  @Input() required = false;

  private readonly api = inject(ApiService);
  private readonly searchTerms$ = new Subject<string>();
  private searchSubscription?: Subscription;
  private hydrateSubscription?: Subscription;

  searchText = '';
  selectedId = 0;
  items: CsaOption[] = [];
  showDropdown = false;
  isLoading = false;
  searchError = '';
  disabled = false;

  private suppressNextInput = false;
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.searchSubscription = this.searchTerms$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((query) => {
        if (query.length < 3) {
          this.items = [];
          this.isLoading = false;
          this.searchError = '';
        }
      }),
      filter((query) => query.length >= 3),
      tap(() => {
        this.isLoading = true;
        this.searchError = '';
        this.showDropdown = true;
      }),
      switchMap((query) =>
        this.api.buscarCSAs(query).pipe(
          catchError(() => {
            this.searchError = 'Não foi possível buscar CSAs.';
            return of({ items: [], total: 0, limit: 20 });
          })
        )
      )
    ).subscribe((response) => {
      this.items = response.items;
      this.isLoading = false;
      this.showDropdown = true;
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.hydrateSubscription?.unsubscribe();
  }

  writeValue(id: number | null): void {
    const numId = Number(id) || 0;

    if (numId <= 0) {
      this.resetDisplay();
      return;
    }

    if (this.selectedId === numId && this.searchText) {
      return;
    }

    this.selectedId = numId;
    this.hydrateSubscription?.unsubscribe();
    this.isLoading = true;

    this.hydrateSubscription = this.api.getCSA(numId).subscribe({
      next: (csa) => {
        this.suppressNextInput = true;
        this.searchText = csa.Label;
        this.isLoading = false;
        setTimeout(() => {
          this.suppressNextInput = false;
        }, 50);
      },
      error: () => {
        this.resetDisplay();
        this.isLoading = false;
      }
    });
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.required) {
      return null;
    }

    const value = Number(control.value) || 0;
    return value > 0 ? null : { required: true };
  }

  onInput(event: Event): void {
    if (this.suppressNextInput) {
      this.suppressNextInput = false;
      return;
    }

    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;

    if (this.selectedId !== 0) {
      this.selectedId = 0;
      this.onChange(0);
    }

    if (value.trim().length >= 3) {
      this.searchTerms$.next(value.trim());
    } else {
      this.items = [];
      this.isLoading = false;
      this.searchError = '';
      this.showDropdown = value.length > 0;
    }
  }

  onFocus(): void {
    if (this.searchText.trim().length >= 3) {
      this.showDropdown = true;
      if (this.items.length === 0 && !this.isLoading) {
        this.searchTerms$.next(this.searchText.trim());
      }
    }
  }

  onBlur(): void {
    this.onTouched();
    setTimeout(() => {
      this.showDropdown = false;
    }, 150);
  }

  selectItem(item: CsaOption): void {
    const id = Number(item.Id);
    this.selectedId = id;
    this.searchText = item.Label;
    this.items = [];
    this.showDropdown = false;
    this.searchError = '';
    this.suppressNextInput = true;
    this.onChange(id);
    this.onTouched();
    setTimeout(() => {
      this.suppressNextInput = false;
    }, 50);
  }

  clear(): void {
    this.resetDisplay();
    this.onChange(0);
    this.onTouched();
  }

  private resetDisplay(): void {
    this.selectedId = 0;
    this.searchText = '';
    this.items = [];
    this.showDropdown = false;
    this.searchError = '';
    this.isLoading = false;
    this.suppressNextInput = false;
  }
}
