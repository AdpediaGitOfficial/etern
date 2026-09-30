import { Component, OnInit } from '@angular/core';
import { TableService } from '../../../shared/services/table.service';
import { CoursematerialService } from '../../../shared/services/coursematerial.service'
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

interface DataItem {
  courseMaterialName: string;  
  categoryName: string;
  subCategoryName: string;
  courseMaterialUrl: string;
  status:  string;
}
@Component({
  selector: 'app-coursematerial-list',
  templateUrl: './coursematerial-list.component.html',
  styleUrls: ['./coursematerial-list.component.css']
})
export class CoursematerialListComponent implements OnInit {
  displayData: DataItem[] = [];
  dataList: DataItem[] = [];
  // Pagination variables
  pageIndex: number = 1;
  pageSize: number = 10;
  total: number ;  
  apiUrl: string = environment.baseUrl;
    orderColumn = [
    {
          title: 'SI.No.',           
    },
    {
        title: 'Course Material Name',
    },
    /*
    {
      title: 'Category',
    },
        {
      title: 'Sub Category',
    },
    */

    {
        title: 'Course Material Url',
    }, 
    /*
    {
      title: 'Type',
    }, 
    */
    {
        title: 'Status',      
    },
    {
      title: 'Actions',      
    }
  ]
  constructor(private tableSvc : TableService, 
              private coursematerialService : CoursematerialService,
              private router : Router,
              private commonService: CommonService,) {  
  }
  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.coursematerialService.getCoursematerials(this.pageIndex, this.pageSize).subscribe({
      next: (res: any) => {
        this.displayData = res.result.data;
        this.dataList = res.result.data; 
        this.total = res.result.totalCount; 
      },
      error: (err) => {
        console.error('Error fetching coursematerials:', err);
      }
    });
  }

  deleteItem(endpoint: string, id: string): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.commonService.deleteItem(endpoint, id).subscribe({
        next: () => {
          alert('Item deleted successfully');
          this.fetchData(); 
        },
        error: (err) => {          
          console.error('Error deleting item:', err);
          const errorMessage = err?.error?.message || 'Failed to delete the item';
          alert(errorMessage);
        },
      });
    }
  }
  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;  
    this.fetchData();  
  }

}
