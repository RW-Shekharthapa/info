import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
}

export type EmployeeInput = Omit<Employee, 'id'>;

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  // The backend (port 8080) is reached through the Ultron proxy on the same origin.
  private readonly url = '/proxy/8080/api/employees';

  list(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.url);
  }

  create(employee: EmployeeInput): Observable<Employee> {
    return this.http.post<Employee>(this.url, employee);
  }

  update(id: number, employee: EmployeeInput): Observable<Employee> {
    return this.http.put<Employee>(`${this.url}/${id}`, employee);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
