import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor() { }

    private allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    private maxFileSize = 2 * 1024 * 1024; // 2 MB

    validateImageFile(file: File): { valid: boolean; error: string | null } {
        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Only JPEG, JPG, and PNG files are allowed.' };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return { valid: false, error: 'File size should not exceed 2 MB.' };
        }

        return { valid: true, error: null };
    }
}
