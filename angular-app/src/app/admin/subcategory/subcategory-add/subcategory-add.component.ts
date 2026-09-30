import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CategoryService } from 'src/app/shared/services/category.service';
import { SubcategoryService } from 'src/app/shared/services/subcategory.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-subcategory-add',
  templateUrl: './subcategory-add.component.html',
  styleUrls: ['./subcategory-add.component.css']
})

export class SubcategoryAddComponent implements OnInit {
  submitDataForm: FormGroup;
  categories: any[] = []; 
  isActive: string = 'true';  
  selectedImage: File | null = null;
  imageError: string | null = null; 
  imagePreviewUrl: SafeUrl | null = null;
  
  constructor(private fb: FormBuilder,
     private categoryService : CategoryService,
     private router: Router, 
     private notification: NzNotificationService,
     private subcategoryService : SubcategoryService,
     private fileUploadService: FileUploadService,
     private sanitizer: DomSanitizer, ) {}

  ngOnInit(): void {
    this.submitDataForm = this.fb.group({
      subCategoryName: ['', [Validators.required, Validators.minLength(3)]],
      imageUpload: [''],
      sorting: ['', [Validators.required, Validators.min(1)]],
      categoryId: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
      isActive: [true, Validators.required],
    });   
  } 
  
  onTypeChange(type: string): void {   
    this.categories =[];
    this.submitDataForm.get('categoryId')?.reset('');     
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
    for (const i in this.submitDataForm.controls) {
      this.submitDataForm.controls[ i ].markAsDirty();
      this.submitDataForm.controls[ i ].updateValueAndValidity();
    }
    if (this.submitDataForm.valid) {
        const formData = new FormData();
        formData.append('subCategoryName', this.submitDataForm.value.subCategoryName);
        formData.append('sorting', this.submitDataForm.value.sorting);
        formData.append('categoryId', this.submitDataForm.value.categoryId);
        formData.append('type', this.submitDataForm.value.type);
        formData.append('description', this.submitDataForm.value.description);
        formData.append('isActive', this.submitDataForm.value.isActive);
        if (this.selectedImage) {
          formData.append('image', this.selectedImage);
        }
      this.subcategoryService.createSubCategory(formData).subscribe({
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
      this.submitDataForm.markAllAsTouched();     
    }
  }
}
