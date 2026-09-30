import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PackageService } from 'src/app/shared/services/package.service';
import { CategoryService } from 'src/app/shared/services/category.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-category-add',
  templateUrl: './category-add.component.html',
  styleUrls: ['./category-add.component.css']
})
export class CategoryAddComponent implements OnInit {
  submitDataForm: FormGroup;
  packages: any[] = []; 
  isActive: string = 'true';  
  selectedImage: File | null = null;
  imageError: string | null = null; 
  imagePreviewUrl: SafeUrl | null = null;

  constructor(private fb: FormBuilder,
    private packageService : PackageService,
    private router: Router,
    private notification: NzNotificationService,
    private categoryService: CategoryService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    ) { }
  
    ngOnInit(): void {
      this.submitDataForm = this.fb.group({
        categoryName: ['', [Validators.required, Validators.minLength(3)]],
        imageUpload: [''],
        sorting: ['', [Validators.required, Validators.min(1)]],
        packageId: ['', Validators.required],
        type: ['', Validators.required],
        description: [''],
        isActive: [true, Validators.required],
      });
      this.fetchPackageData();     
    } 

    fetchPackageData(): void {      
      this.packageService.getActivePackages().subscribe({
        next: (res: any) => {
          this.packages = res.result;         
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
        formData.append('categoryName', this.submitDataForm.value.categoryName);
        formData.append('sorting', this.submitDataForm.value.sorting);
        formData.append('packageId', this.submitDataForm.value.packageId);
        formData.append('type', this.submitDataForm.value.type);
        formData.append('description', this.submitDataForm.value.description);
        formData.append('isActive', this.submitDataForm.value.isActive);
        if (this.selectedImage) {
          formData.append('image', this.selectedImage);
        }
        this.categoryService.createCategory(formData).subscribe({
          next: (response) => {
            console.log('Category created successfully:', response);
            this.notification.success('Success', 'Category created successfully!');
            this.router.navigate(['/admin/categories']); 
          },
          error: (err) => {
            console.error('Error creating Category:', err);
            this.notification.error('Error', 'Failed to create Category. Please try again.');
          },
        });
      } 
      else {
        console.error('Form is invalid');
        this.submitDataForm.markAllAsTouched();     
      }
    }  
}
