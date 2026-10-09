import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee, EmployeeService } from '../employee.service';

@Component({
  selector: 'app-employees',
  imports: [ReactiveFormsModule],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class Employees {
  private readonly service = inject(EmployeeService);
  private readonly fb = inject(FormBuilder);
  private toastTimer?: ReturnType<typeof setTimeout>;

  protected readonly employees = signal<Employee[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly search = signal('');

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Employee | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly deleting = signal<Employee | null>(null);
  protected readonly deleteBusy = signal(false);
  protected readonly deleteError = signal('');

  protected readonly toast = signal('');

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.employees();
    }
    return this.employees().filter((e) =>
      [e.employeeId, e.name, e.email, e.designation].some((v) => v.toLowerCase().includes(term))
    );
  });

  protected readonly form = this.fb.nonNullable.group({
    employeeId: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/.*\S.*/)]],
    name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/.*\S.*/)]],
    email: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)]],
    designation: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/.*\S.*/)]]
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.service.list().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(this.message(err, 'Could not load employees.'));
        this.loading.set(false);
      }
    });
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset();
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(employee: Employee): void {
    this.editing.set(employee);
    this.form.reset(employee);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (!this.saving()) {
      this.formOpen.set(false);
    }
  }

  protected invalid(field: 'employeeId' | 'name' | 'email' | 'designation'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const current = this.editing();
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.formError.set('');
    const request = current ? this.service.update(current.id, value) : this.service.create(value);
    request.subscribe({
      next: (saved) => {
        this.employees.update((list) =>
          current ? list.map((e) => (e.id === saved.id ? saved : e)) : [...list, saved]
        );
        this.saving.set(false);
        this.formOpen.set(false);
        this.showToast(current ? `${saved.name} was updated.` : `${saved.name} was added.`);
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(this.message(err, 'Could not save the employee.'));
        this.saving.set(false);
      }
    });
  }

  protected askDelete(employee: Employee): void {
    this.deleteError.set('');
    this.deleting.set(employee);
  }

  protected cancelDelete(): void {
    if (!this.deleteBusy()) {
      this.deleting.set(null);
    }
  }

  protected confirmDelete(): void {
    const target = this.deleting();
    if (!target || this.deleteBusy()) {
      return;
    }
    this.deleteBusy.set(true);
    this.deleteError.set('');
    this.service.delete(target.id).subscribe({
      next: () => {
        this.employees.update((list) => list.filter((e) => e.id !== target.id));
        this.deleteBusy.set(false);
        this.deleting.set(null);
        this.showToast(`${target.name} was deleted.`);
      },
      error: (err: HttpErrorResponse) => {
        this.deleteError.set(this.message(err, 'Could not delete the employee.'));
        this.deleteBusy.set(false);
      }
    });
  }

  private showToast(text: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(text);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3500);
  }

  private message(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) {
      return 'Cannot reach the server. Check that the backend is running and try again.';
    }
    return err.error?.message || fallback;
  }
}
