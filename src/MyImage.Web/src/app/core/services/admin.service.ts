
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/admin/dashboard`);
  }

  getOrders(status?: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<any>>> {
    let url = `${environment.apiUrl}/admin/orders?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<ApiResponse<PagedResult<any>>>(url);
  }

  // FIXED: Add getOrderDetails method
  getOrderDetails(orderId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/admin/orders/${orderId}`);
  }

  updateOrderStatus(orderId: string, status: string, notes?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/orders/${orderId}/status`, {
      status,
      notes
    });
  }

  completeOrder(orderId: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/admin/orders/${orderId}/complete`, data);
  }

  getAllPrintSizes(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/admin/print-sizes`);
  }

  updatePrintSize(sizeId: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/print-sizes/${sizeId}`, data);
  }

  addPrintSize(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/admin/print-sizes`, data);
  }

  // FIXED: Add bulk order operations for admin efficiency
  bulkUpdateOrderStatus(orderIds: string[], status: string, notes?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/orders/bulk/status`, {
      orderIds,
      status,
      notes
    });
  }

  // FIXED: Add export functionality for order reports
  exportOrders(filters?: any): Observable<Blob> {
    let url = `${environment.apiUrl}/admin/orders/export`;
    const params = new URLSearchParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get(url, { responseType: 'blob' });
  }

  // FIXED: Add order search functionality
  searchOrders(searchTerm: string, page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<any>>> {
    return this.http.get<ApiResponse<PagedResult<any>>>(
      `${environment.apiUrl}/admin/orders/search?q=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`
    );
  }

  // FIXED: Add system settings management
  getSystemSettings(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/admin/settings`);
  }

  updateSystemSetting(key: string, value: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/settings/${key}`, { value });
  }

  // FIXED: Add user management functions
  getUsers(page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<any>>> {
    return this.http.get<ApiResponse<PagedResult<any>>>(
      `${environment.apiUrl}/admin/users?page=${page}&pageSize=${pageSize}`
    );
  }

  updateUserRole(userId: string, role: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/users/${userId}/role`, { role });
  }

  deactivateUser(userId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/users/${userId}/deactivate`, {});
  }

  activateUser(userId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${environment.apiUrl}/admin/users/${userId}/activate`, {});
  }
}
