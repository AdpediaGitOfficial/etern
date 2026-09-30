import { Component } from '@angular/core'
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Component({
    templateUrl: './dashboard.component.html'
})

export class DashboardComponent {

    themeColors = this.colorConfig.get().colors;
    blue = this.themeColors.blue;
    blueLight = this.themeColors.blueLight;
    cyan = this.themeColors.cyan;
    cyanLight = this.themeColors.cyanLight;
    gold = this.themeColors.gold;
    purple = this.themeColors.purple;
    purpleLight = this.themeColors.purpleLight;
    red = this.themeColors.red;

    taskListIndex: number = 0;
    dashboardDetails: any;
    revenueDetails: any;
    totalUsers: number;
    totalStudents: number;
    registeredThisMonth: number; 
    subscribedThisMonth: number;
    freeUsersThisMonth : number;
    currentMonthRevenue: number;
    growthPercentage: number;
    videoDetails: any;
    displayData = [];
    displayTrendingVideoData = [];
    apiUrl: string = environment.baseUrl;  
  
    constructor( private colorConfig:ThemeConstantService,
                private commonService: CommonService ) {}

    revenueChartFormat: string = 'revenueMonth';
   
    revenueChartData: Array<any> = [{ data: [], label: 'Students Subscribed' }];
    revenueChartLabels: Array<string> = [];
    revenueChartType = 'line';
    revenueChartOptions: any = {
      maintainAspectRatio: false,
      responsive: true,
      hover: {
          mode: 'nearest',
          intersect: true
      },
      tooltips: {
          mode: 'index'
      },
      scales: {
          xAxes: [{ 
              gridLines: [{
                  display: false,
              }],
              ticks: {
                  display: true,
                  fontColor: this.themeColors.grayLight,
                  fontSize: 13,
                  padding: 10
              }
          }],
          yAxes: [{
              gridLines: {
                  drawBorder: false,
                  drawTicks: false,
                  borderDash: [3, 4],
                  zeroLineWidth: 1,
                  zeroLineBorderDash: [3, 4]  
              },
              ticks: {
                  display: true,
                  max: 100,                            
                  //stepSize: 20,
                  stepSize: 1,
                  fontColor: this.themeColors.grayLight,
                  fontSize: 13,
                  padding: 10
              }  
          }],
      }
  };
  currentrevenueChartLabelsIdx = 1;
    
    
    revenueChartColors: Array<any> = [
        { 
            backgroundColor: this.themeColors.transparent,
            borderColor: this.blue,
            pointBackgroundColor: this.blue,
            pointBorderColor: this.themeColors.white,
            pointHoverBackgroundColor: this.blueLight,
            pointHoverBorderColor: this.blueLight
        }
    ];
   

    ngOnInit(): void {
        this.fetchDashboardStudentData(); 
        this.fetchDashboardRevenueData(); 
        this.loadSubscriptionChartData();
        this.fetchDashboardVideoData();  
        this.fetchTrendingVideoData();        
    }
    fetchDashboardStudentData(): void {
        this.commonService.getAllData('user/userCount').subscribe({
          next: (res: any) => {
            this.dashboardDetails = res.result; 
            this.totalUsers = res.result.totalUsers;
            this.totalStudents = res.result.totalStudents;
            this.registeredThisMonth = res.result.registeredThisMonth;
            this.subscribedThisMonth = res.result.subscribedThisMonth;
            this.freeUsersThisMonth = res.result.freeUsersThisMonth; 
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
        });
    }

    fetchDashboardRevenueData(): void {
        this.commonService.getAllData('subscription/revenueDetails').subscribe({
          next: (res: any) => {
            this.revenueDetails = res.result; 
            this.currentMonthRevenue = res.result.currentMonthRevenue;
            this.growthPercentage = res.result.growthPercentage;          
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
        });
    }

    fetchDashboardVideoData(): void {    
        this.commonService.getAllData('courseMaterial/videoDetails').subscribe({
          next: (res: any) => {
            this.displayData = res.result;
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
        });
    }
       
    fetchTrendingVideoData(): void {    
        this.commonService.getAllData('courseMaterial/dashboard/trendingVideoDetails').subscribe({
          next: (res: any) => {
            this.displayTrendingVideoData = res.result;
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
        });
    }

    loadSubscriptionChartData(): void {    
        this.commonService.getAllData('student/dashboard/subscriptions').subscribe({
          next: (res: any) => {
            this.revenueChartLabels =  res.result.map(item => item.subscription_date);
            this.revenueChartData = [{ 
              data: res.result.map(item => item.total_subscriptions),
              label: 'Students Subscribed' 
            }];            
          },
          error: (err) => {
            console.error('Error fetching data:', err);
          }
        });
    } 
       
}  
