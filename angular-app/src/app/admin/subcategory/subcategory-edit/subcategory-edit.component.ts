import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CategoryService } from 'src/app/shared/services/category.service';
import { SubcategoryService } from 'src/app/shared/services/subcategory.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-subcategory-edit',
  templateUrl: './subcategory-edit.component.html',
  styleUrls: ['./subcategory-edit.component.css']
})
export class SubcategoryEditComponent implements OnInit {
  editDataForm: FormGroup;
  categories: any[] = []; 
  isActive: string = 'true';  
  selectedImage: File | null = null;
  imageError: string | null = null; 
  imagePreviewUrl: SafeUrl | null = null;
  subcategoryId: string;
  
  constructor(
     private fb: FormBuilder,
     private categoryService : CategoryService,
     private router: Router, 
     private notification: NzNotificationService,
     private subcategoryService : SubcategoryService,
     private fileUploadService: FileUploadService,
     private sanitizer: DomSanitizer, 
     private route: ActivatedRoute,
     private commonService: CommonService,) {}

  ngOnInit(): void {
    this.subcategoryId = this.route.snapshot.params['id'];    
    this.editDataForm = this.fb.group({
      subCategoryName: ['', [Validators.required, Validators.minLength(3)]],
      imageUpload: [''],
      sorting: ['', [Validators.required, Validators.min(1)]],
      categoryId: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
      isActive: [true, Validators.required],
    });  
    this.loadFormDetails(); 
  }

  loadFormDetails(): void {
    this.commonService.getDataById('/api/subcategory',this.subcategoryId).subscribe({
      next: (response: any) => {
        const resData = response.result;
        this.onTypeChange(resData.type);
        this.editDataForm.patchValue({
          subCategoryName: resData.subCategoryName,
          sorting: resData.sorting,
          type: resData.type,
          description: resData.description,
          isActive: resData.isActive === true          
        });
        setTimeout(() => {
          this.editDataForm.patchValue({
            categoryId: resData.categoryId._id,
          });
        }, 100);
        if (resData.imageUrl) {
          this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(environment.baseUrl+resData.imageUrl);
        }
      },
      error: (err) => {
        this.router.navigate(['/admin/subcategories']);
        this.notification.error('Error', 'Failed to load sub category details.');
        
      }
    });
  }

  onTypeChange(type: string): void {   
    this.categories =[];
    this.editDataForm.get('categoryId')?.reset('');     
    this.categoryService.getActiveCategories(type).subscribe({
      next: (res: any) => {
        this.categories = res.result;         
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
        const file = input.files[0];
        const validationResult = this.fileUploadService.validateImageFile(file);  
        if (!validationResult.valid) {
            this.imageError = validationResult.error;
            this.selectedImage = null;
            this.imagePreviewUrl = null; 
        } else {
            this.imageError = null;
            this.selectedImage = file;  
            const objectUrl = URL.createObjectURL(file);
            this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);       
        }
    }
  } 
  
  submitForm(): void {      
    for (const i in this.editDataForm.controls) {
      this.editDataForm.controls[ i ].markAsDirty();
      this.editDataForm.controls[ i ].updateValueAndValidity();
    }
    if (this.editDataForm.valid) {
        const formData = new FormData();
        formData.append('subCategoryName', this.editDataForm.value.subCategoryName);
        formData.append('sorting', this.editDataForm.value.sorting);
        formData.append('categoryId', this.editDataForm.value.categoryId);
        formData.append('type', this.editDataForm.value.type);
        formData.append('description', this.editDataForm.value.description);
        formData.append('isActive', this.editDataForm.value.isActive);
        if (this.selectedImage) {
          formData.append('image', this.selectedImage);
        }
        this.commonService.updateData('/api/subcategory', this.subcategoryId, formData).subscribe({      
        next: (response) => {
          console.log('Sub Category created successfully:', response);
          this.notification.success('Success', 'Sub Category created successfully!');
          this.router.navigate(['/admin/subcategories']); 
        },
        error: (err) => {
          console.error('Error creating Sub Category:', err);
          this.notification.error('Error', 'Failed to create Sub Category. Please try again.');
        },
      });
    } 
    else {
      console.error('Form is invalid');
      this.editDataForm.markAllAsTouched();     
    }
  }

}
