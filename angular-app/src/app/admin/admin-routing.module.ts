import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/auth/auth.guard'; 
import { UserListComponent } from './users/user-list/user-list.component';
import { PackageListComponent } from './packages/package-list/package-list.component';
import { CoursematerialListComponent } from './coursematerial/coursematerial-list/coursematerial-list.component'
import {CoursematerialAddComponent } from './coursematerial/coursematerial-add/coursematerial-add.component'
import { CategoryListComponent } from './category/category-list/category-list.component';
import { SubcategoryListComponent } from './subcategory/subcategory-list/subcategory-list.component';
import {PackageAddComponent} from './packages/package-add/package-add.component';
import { CategoryAddComponent } from './category/category-add/category-add.component';
import {SubcategoryAddComponent} from './subcategory/subcategory-add/subcategory-add.component';
import {CategoryEditComponent} from './category/category-edit/category-edit.component';
import {PackageEditComponent} from './packages/package-edit/package-edit.component';
import {SubcategoryEditComponent} from './subcategory/subcategory-edit/subcategory-edit.component';
import {CoursematerialEditComponent } from './coursematerial/coursematerial-edit/coursematerial-edit.component'
import {PackageDetailComponent} from './packages/package-detail/package-detail.component';
import {CategoryDetailComponent} from './category/category-detail/category-detail.component';
import {SubcategoryDetailComponent} from './subcategory/subcategory-detail/subcategory-detail.component';
import {CoursematerialDetailComponent} from './coursematerial/coursematerial-detail/coursematerial-detail.component';
import { UserDetailComponent } from './users/user-detail/user-detail.component';
import { OfflinepaymentAddComponent } from './offlinepayments/offlinepayment-add/offlinepayment-add.component';
import { OfflinepaymentListComponent } from './offlinepayments/offlinepayment-list/offlinepayment-list.component';
import {OnlinepaymentListComponent} from './onlinepayments/onlinepayment-list/onlinepayment-list.component';
import { OfflinepaymentDetailComponent } from './offlinepayments/offlinepayment-detail/offlinepayment-detail.component';
import { OnlinepaymentDetailComponent } from './onlinepayments/onlinepayment-detail/onlinepayment-detail.component';

const routes: Routes = [
    {
        path: 'users',
        component: UserListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'users',
            headerDisplay: "none",
            filterType: 'all'
        }
    },
    {
        path: 'users/upcoming',
        component: UserListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'upcoming-users',
            headerDisplay: "none",
            filterType: 'upcoming'
        }
    },
    {
        path: 'users/expired',
        component: UserListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'expired-users',
            headerDisplay: "none",
            filterType: 'expired'
        }
    },
    
    {
        path: 'packages',
        component: PackageListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'users',
            headerDisplay: "none"
        }
    },
    {
        path: 'coursematerials',
        component: CoursematerialListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'coursematerials',
            headerDisplay: "none"
        }
    },
    {
        path: 'coursematerial-add',
        component: CoursematerialAddComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'coursematerial-add',
            headerDisplay: "none"
        }
    },
    {
        path: 'categories',
        component: CategoryListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'categories',
            headerDisplay: "none"
        }
    },
    {
        path: 'subcategories',
        component: SubcategoryListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'subcategories',
            headerDisplay: "none"
        }
    },
    {
        path: 'package-add',
        component: PackageAddComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'package-add',
            headerDisplay: "none"
        }
    },
    {
        path: 'category-add',
        component: CategoryAddComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'category-add',
            headerDisplay: "none"
        }
    },
    {
        path: 'subcategory-add',
        component: SubcategoryAddComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'category-add',
            headerDisplay: "none"
        }
    },
    {
        path: 'category-edit/:id',
        component: CategoryEditComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Category Edit',
            headerDisplay: "none"
        }
    },
    {
        path: 'package-edit/:id',
        component: PackageEditComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Package Edit',
            headerDisplay: "none"
        }
    },

    {
        path: 'subcategory-edit/:id',
        component: SubcategoryEditComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Category Edit',
            headerDisplay: "none"
        }
    },    
    {
        path: 'coursematerial-edit/:id',
        component: CoursematerialEditComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Category Edit',
            headerDisplay: "none"
        }
    },
    {
        path: 'package-detail/:id',
        component: PackageDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Package Detail',
            headerDisplay: "none"
        }
    },
    {
        path: 'category-detail/:id',
        component: CategoryDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Category Detail',
            headerDisplay: "none"
        }
    },
    {
        path: 'subcategory-detail/:id',
        component: SubcategoryDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Category Detail',
            headerDisplay: "none"
        }
    },
    {
        path: 'coursematerial-detail/:id',
        component: CoursematerialDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'Coursematerial Detail',
            headerDisplay: "none"
        }
    },    
    {
        path: 'user-detail/:id',
        component: UserDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'User Detail',
            headerDisplay: "none"
        }
    },
    {
        path: 'offlinepayment-add/:id/:fullName',
        component: OfflinepaymentAddComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'offlinepayment-add',
            headerDisplay: "none"
        }
    },
    {
        path: 'offlinepayments',
        component: OfflinepaymentListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'offlinepayment-list',
            headerDisplay: "none"
        }
    },
    {
        path: 'onlinepayments',
        component: OnlinepaymentListComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'onlinepayment-list',
            headerDisplay: "none"
        }
    },
    {
        path: 'offlinepayment-detail/:id',
        component: OfflinepaymentDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'offlinepayment-detail',
            headerDisplay: "none"
        }
    },
    {
        path: 'onlinepayment-detail/:id',
        component: OnlinepaymentDetailComponent,
        canActivate: [AuthGuard],
        data: {
            title: 'onlinepayment-detail',
            headerDisplay: "none"
        }
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminRoutingModule { }
