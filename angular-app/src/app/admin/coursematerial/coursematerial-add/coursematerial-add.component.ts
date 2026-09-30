import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService} from 'src/app/shared/services/category.service'
import { SubcategoryService } from 'src/app/shared/services/subcategory.service';
import { CoursematerialService } from 'src/app/shared/services/coursematerial.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-coursematerial-add',
  templateUrl: './coursematerial-add.component.html',
  styleUrls: ['./coursematerial-add.component.css']
})
export class CoursematerialAddComponent implements OnInit {
  courseMaterialForm: FormGroup;
  categories: any[] = []; 
  subCategories: any[] = []; 
  isActive: string = 'true';  
  selectedImage: File | null = null;
  imageError: string | null = null; 
  imagePreviewUrl: SafeUrl | null = null;
  
  constructor(private fb: FormBuilder,
     private categoryService : CategoryService,
     private subcategoryService : SubcategoryService,
     private coursematerialService : CoursematerialService,
     private router: Router, 
     private notification: NzNotificationService,
     private fileUploadService: FileUploadService,  
     private sanitizer: DomSanitizer,   ) {}     

  ngOnInit(): void {
    this.courseMaterialForm = this.fb.group({
      courseMaterialName: ['', [Validators.required, Validators.minLength(3)]],
      courseMaterialUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^\s$.?#].[^\s]*$/)]],
      sorting: ['', [Validators.required, Validators.min(1)]],
      categoryId: ['', Validators.required],
      subCategoryId: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
      imageUpload: [''],
      isActive: [true, Validators.required],
    });   
  } 

  onCategoryChange(categoryId: string): void {
    this.subCategories = [];
    this.courseMaterialForm.get('subCategoryId')?.reset(''); 
    const type = this.courseMaterialForm.get('type')?.value;
    this.subcategoryService.getSubCategories(categoryId, type).subscribe({
      next: (res: any) => {
        this.subCategories = res.result;         
      },
      error: (err) => {
        this.subCategories = [];
        console.error('Error fetching sub categories:', err);
      }
    });
  }  
  
  onTypeChange(type: string): void {   
    this.categories =[];
    this.subCategories = [];
    this.courseMaterialForm.get('categoryId')?.reset(''); 
    this.courseMaterialForm.get('subCategoryId')?.reset(''); 
    
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
    for (const i in this.courseMaterialForm.controls) {
      this.courseMaterialForm.controls[ i ].markAsDirty();
      this.courseMaterialForm.controls[ i ].updateValueAndValidity();
    }
    if (this.courseMaterialForm.valid) {
    const formData = new FormData();
    formData.append('courseMaterialName', this.courseMaterialForm.value.courseMaterialName);
    formData.append('courseMaterialUrl', this.courseMaterialForm.value.courseMaterialUrl);
    formData.append('sorting', this.courseMaterialForm.value.sorting); 
    formData.append('categoryId', this.courseMaterialForm.value.categoryId);        
    formData.append('subCategoryId', this.courseMaterialForm.value.subCategoryId);
    formData.append('type', this.courseMaterialForm.value.type);
    formData.append('description', this.courseMaterialForm.value.description);
    formData.append('isActive', this.courseMaterialForm.value.isActive);
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    //  const courseMaterialData = this.courseMaterialForm.value;
      this.coursematerialService.createCourseMaterial(formData).subscribe({
        next: (response) => {
          console.log('Course material created successfully:', response);
          this.notification.success('Success', 'Course material created successfully!');
          this.router.navigate(['/admin/coursematerials']); 
        },
        error: (err) => {
          console.error('Error creating course material:', err);
          this.notification.error('Error', 'Failed to create course material. Please try again.');
        },
      });
    } 
    else {
      console.error('Form is invalid');
      this.courseMaterialForm.markAllAsTouched();     
    }
  }
}
