import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubcategoryService {
  constructor(private http: HttpClient) { }

  getSubCategories(categoryId: string, type:string): Observable<any> {
    const currentUser = localStorage.getItem('currentUser'); 
    const token = currentUser ? JSON.parse(currentUser).token : null;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, 
    });    
    return this.http.get(`${environment.baseUrl}/api/subcategory/by-categoryAdmin/${categoryId}/${type}`, {headers});    
  }

  getAllSubCategories(pageIndex: number, pageSize: number): Observable<any> {
    const currentUser = localStorage.getItem('currentUser'); 
    const token = currentUser ? JSON.parse(currentUser).token : null;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });  
    let params = new HttpParams()
      .set('page', pageIndex.toString())
      .set('limit', pageSize.toString());  
    return this.http.get(`${environment.baseUrl}/api/subcategory/all`, { headers, params });
  }
  
  createSubCategory(formData: any): Observable<any> {
    const currentUser = localStorage.getItem('currentUser'); 
    const token = currentUser ? JSON.parse(currentUser).token : null;
    const headers = new HttpHeaders({      
      Authorization: `Bearer ${token}`,
    });    
    return this.http.post(
      `${environment.baseUrl}/api/subcategory`,
      formData,
      {
        headers,
        withCredentials: true, 
      }
    );
  }

}
