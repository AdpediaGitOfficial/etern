import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  dislayDetails: any;
  id: string;
  imagePreviewUrl: SafeUrl | null = null;
  age: number;
    
  constructor(private route: ActivatedRoute,
              private commonService: CommonService,
              private router:Router,
              private notification: NzNotificationService,
              private sanitizer: DomSanitizer,
            ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');  
    this.loadData();    
  }

  loadData(): void {
    this.commonService.getDataById('/api/student', this.id).subscribe({
      next: (response: any) => {
        if (response.success && response.result) {
          this.dislayDetails = response.result; 
          this.age = this.calculateAge(this.dislayDetails.dob);
          if (this.dislayDetails.imageUrl) {
            this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(environment.baseUrl+this.dislayDetails.avatar);
          }
        } else {
          this.notification.error('Error', 'Data not found.');
          this.router.navigate(['/admin/users']);
        }
      },
      error: (err) => {
        this.notification.error('Error', 'Failed to load data.');
        this.router.navigate(['/admin/users']);
      },
    });
  }

  calculateAge(dob: string | Date): number {
    const dobDate = new Date(dob); // MongoDB ISO date format will be parsed correctly
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDifference = today.getMonth() - dobDate.getMonth();
  
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  
    return age;
  }

  get showOfflinePaymentButton(): boolean {
    const user = this.dislayDetails;
    if (!user) return false;
  
    const today = new Date();
    const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
  
    return !user.subscribed || (endDate && endDate < today);
  }
  
  

}
