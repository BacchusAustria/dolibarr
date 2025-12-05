import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { Customer } from '../../models/customer.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private api: ApiService) {}

  async getCustomers(): Promise<Customer[]> {
    return firstValueFrom(this.api.get<Customer[]>('/thirdparties'));
  }

  async getCustomerById(id: string): Promise<Customer> {
    return firstValueFrom(this.api.get<Customer>(`/thirdparties/${id}`));
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return firstValueFrom(this.api.post<Customer>('/thirdparties', customer));
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    return firstValueFrom(this.api.put<Customer>(`/thirdparties/${id}`, customer));
  }

  async deleteCustomer(id: string): Promise<void> {
    await firstValueFrom(this.api.delete<void>(`/thirdparties/${id}`));
  }
}
