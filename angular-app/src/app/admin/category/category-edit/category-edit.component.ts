import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PackageService } from 'src/app/shared/services/package.service';
import { CategoryService } from 'src/app/shared/services/category.service';
import { FileUploadService } from 'src/app/shared/services/file-upload.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-category-edit',
  templateUrl: './category-edit.component.html',
  styleUrls: ['./category-edit.component.css']
})
export class CategoryEditComponent implements OnInit {
  editDataForm: FormGroup;
  packages: any[] = [];
  isActive: string = 'true';
  selectedImage: File | null = null;
  imageError: string | null = null;
  imagePreviewUrl: SafeUrl | null = null;
  categoryId: string;

  constructor(
    private fb: FormBuilder,
    private packageService: PackageService,
    private router: Router,
    private notification: NzNotificationService,
    private categoryService: CategoryService,
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['id'];
    this.editDataForm = this.fb.group({
      categoryName: ['', [Validators.required, Validators.minLength(3)]],
      sorting: ['', [Validators.required, Validators.min(1)]],
      packageId: ['', Validators.required],
      type: ['', Validators.required],
      description: [''],
      isActive: [false, Validators.required],
      imageUpload: ['']
    });

    this.fetchPackageData();
    this.loadCategoryDetails();
  }

  fetchPackageData(): void {
    this.packageService.getActivePackages().subscribe({
      next: (res: any) => {
        this.packages = res.result;
      },
      error: (err) => {
        console.error('Error fetching packages:', err);
      }
    });
  }  

  loadCategoryDetails(): void {
    this.commonService.getDataById('/api/category',this.categoryId).subscribe({
      next: (response: any) => {
        const resData = response.result;
        this.editDataForm.patchValue({
          categoryName: resData.categoryName,
          sorting: resData.sorting,
          packageId: resData.packageId._id,
          type: resData.type,
          description: resData.description,
          isActive: resData.isActive === true          
        });        
        if (resData.imageUrl) {
          this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(environment.baseUrl+resData.imageUrl);
        }
      },
      error: (err) => {
        this.router.navigate(['/admin/categories']);
        this.notification.error('Error', 'Failed to load category details.');        
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
      this.editDataForm.controls[i].markAsDirty();
      this.editDataForm.controls[i].updateValueAndValidity();
    }
    if (this.editDataForm.valid) {
      const formData = new FormData();
      formData.append('categoryName', this.editDataForm.value.categoryName);
      formData.append('sorting', this.editDataForm.value.sorting);
      formData.append('packageId', this.editDataForm.value.packageId);
      formData.append('type', this.editDataForm.value.type);
      formData.append('description', this.editDataForm.value.description);
      formData.append('isActive', this.editDataForm.value.isActive);
      if (this.selectedImage) {
        formData.append('image', this.selectedImage);
      }      
      this.commonService.updateData('/api/category', this.categoryId, formData).subscribe({
        next: (response) => {
          console.log('Category updated successfully:', response);
          this.notification.success('Success', 'Category updated successfully!');
          this.router.navigate(['/admin/categories']);
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.notification.error('Error', 'Failed to update category. Please try again.');
        }
      });
    } else {
      console.error('Form is invalid');
      this.editDataForm.markAllAsTouched();
    }
    
  }
}
