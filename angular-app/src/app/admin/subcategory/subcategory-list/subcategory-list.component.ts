import { Component, OnInit } from '@angular/core';
import { TableService } from '../../../shared/services/table.service';
import { SubcategoryService} from 'src/app/shared/services/subcategory.service'
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/shared/services/common.service';

interface DataItem {
  subCategoryName: string;
  packageName: string;
  description: string;
  status:  string;
}
@Component({
  selector: 'app-subcategory-list',
  templateUrl: './subcategory-list.component.html',
  styleUrls: ['./subcategory-list.component.css']
})
export class SubcategoryListComponent implements OnInit {
  displayData: DataItem[] = [];
  dataList: DataItem[] = [];
  apiUrl: string = environment.baseUrl;
  // Pagination variables
  pageIndex: number = 1;
  pageSize: number = 10;
  total: number ;  

    orderColumn = [
    {
          title: 'SI.No.',           
    },
    {
      title: 'Sub Category Name',
    },
    {
        title: 'Category Name',
    },
    /*
    {
      title: 'Package',
    },
    */
    {
      title: 'Description',
    },    
    {
      title: 'Type',
    },
    {
        title: 'Status',      
    },
    {
      title: 'Actions',      
    }
  ]
  constructor(private tableSvc : TableService, 
              private SubcategoryService : SubcategoryService,
              private router : Router,
              private commonService: CommonService,) {
  
  }
  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.SubcategoryService.getAllSubCategories(this.pageIndex, this.pageSize).subscribe({
      next: (res: any) => {
        this.displayData = res.result.data;
        this.dataList = res.result.data; 
        this.total = res.result.totalCount; 
      },
      error: (err) => {
        console.error('Error fetching sub category:', err);
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
