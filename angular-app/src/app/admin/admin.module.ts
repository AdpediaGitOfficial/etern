import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { QuillModule } from 'ngx-quill';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
//import { AppsService } from '../shared/services/apps.service';
import { TableService } from '../shared/services/table.service';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { UserListComponent } from './users/user-list/user-list.component';
import { PackageListComponent } from './packages/package-list/package-list.component';
import { CoursematerialListComponent } from './coursematerial/coursematerial-list/coursematerial-list.component';
import { CoursematerialAddComponent } from './coursematerial/coursematerial-add/coursematerial-add.component';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { CategoryListComponent } from './category/category-list/category-list.component';
import { SubcategoryListComponent } from './subcategory/subcategory-list/subcategory-list.component';
import { PackageAddComponent } from './packages/package-add/package-add.component';
import { CategoryAddComponent } from './category/category-add/category-add.component';
import { SubcategoryAddComponent } from './subcategory/subcategory-add/subcategory-add.component';
import { CategoryEditComponent } from './category/category-edit/category-edit.component';
import { PackageEditComponent } from './packages/package-edit/package-edit.component';
import { SubcategoryEditComponent } from './subcategory/subcategory-edit/subcategory-edit.component';
import { CoursematerialEditComponent } from './coursematerial/coursematerial-edit/coursematerial-edit.component';
import { PackageDetailComponent } from './packages/package-detail/package-detail.component';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { CategoryDetailComponent } from './category/category-detail/category-detail.component';
import { SubcategoryDetailComponent } from './subcategory/subcategory-detail/subcategory-detail.component';
import { CoursematerialDetailComponent } from './coursematerial/coursematerial-detail/coursematerial-detail.component';
import { UserDetailComponent } from './users/user-detail/user-detail.component';
import { OfflinepaymentAddComponent } from './offlinepayments/offlinepayment-add/offlinepayment-add.component';
import { OfflinepaymentListComponent } from './offlinepayments/offlinepayment-list/offlinepayment-list.component';
import { OnlinepaymentListComponent } from './onlinepayments/onlinepayment-list/onlinepayment-list.component';
import { OfflinepaymentDetailComponent } from './offlinepayments/offlinepayment-detail/offlinepayment-detail.component';
import { OnlinepaymentDetailComponent } from './onlinepayments/onlinepayment-detail/onlinepayment-detail.component';

const antdModule = [
    NzButtonModule,
    NzCardModule,
    NzAvatarModule,
    NzRateModule,
    NzBadgeModule,
    NzProgressModule,
    NzRadioModule,
    NzTableModule,
    NzDropDownModule,
    NzTimelineModule,
    NzTabsModule,
    NzTagModule,
    NzListModule,
    NzCalendarModule,
    NzToolTipModule,
    NzFormModule,
    NzModalModule,
    NzSelectModule,
    NzUploadModule,
    NzInputModule,
    NzPaginationModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzMessageModule,
    NzNotificationModule,
    NzBreadCrumbModule,
    NzDescriptionsModule,
    
]

@NgModule({
    imports: [
        SharedModule,
        ReactiveFormsModule,
        AdminRoutingModule,
        QuillModule.forRoot(),
        ...antdModule
    ],
    declarations: [
        UserListComponent,
        PackageListComponent,
        CoursematerialListComponent,
        CoursematerialAddComponent,
        CategoryListComponent,
        SubcategoryListComponent,
        PackageAddComponent,
        CategoryAddComponent,
        SubcategoryAddComponent,
        CategoryEditComponent,
        PackageEditComponent,
        SubcategoryEditComponent,
        CoursematerialEditComponent,
        PackageDetailComponent,
        CategoryDetailComponent,
        SubcategoryDetailComponent,
        CoursematerialDetailComponent,
        UserDetailComponent,
        OfflinepaymentAddComponent,
        OfflinepaymentListComponent,
        OnlinepaymentListComponent,
        OfflinepaymentDetailComponent,
        OnlinepaymentDetailComponent,
    ],
    providers: [
        ThemeConstantService,
      //  AppsService,
        TableService
    ]
})

export class AdminModule {}