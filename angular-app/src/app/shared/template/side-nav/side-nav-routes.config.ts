import { SideNavInterface } from '../../interfaces/side-nav.type';
export const ROUTES: SideNavInterface[] = [
    {
        path: '',
        title: 'Dashboard',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'dashboard',
        submenu: []
    },
    {
        path: '',
        title: 'Master Operations',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'appstore',
        submenu: [            
            { 
                path: '',
                title: 'Packages', 
                iconType: '', 
                icon: '',
                iconTheme: '',
                submenu: [
                    {
                        path: '/admin/packages',
                        title: 'All Packages',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }, 
                    {
                        path: '/admin/package-add',
                        title: 'Add Package',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }    
                ] 
            },
            { 
                path: '',
                title: 'Categories', 
                iconType: '', 
                icon: '',
                iconTheme: '',
                submenu: [
                    {
                        path: '/admin/categories',
                        title: 'All Categories',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }, 
                    {
                        path: '/admin/category-add',
                        title: 'Add Category',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }    
                ] 
            },
            { 
                path: '',
                title: 'Sub Categories', 
                iconType: '', 
                icon: '',
                iconTheme: '',
                submenu: [
                    {
                        path: '/admin/subcategories',
                        title: 'All Sub Categories',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }, 
                    {
                        path: '/admin/subcategory-add',
                        title: 'Add Sub Category',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }    
                ] 
            },
            { 
                path: '',
                title: 'Course Materials', 
                iconType: '', 
                icon: '',
                iconTheme: '',
                submenu: [
                    {
                        path: '/admin/coursematerials',
                        title: 'All Course Materials',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }, 
                    {
                        path: '/admin/coursematerial-add',
                        title: 'Add Course Material',
                        iconType: 'nzIcon',
                        iconTheme: 'outline',
                        icon: '',
                        submenu: []
                    }    
                ] 
            }
        ]
    },
    /*
    {
        path: '/admin/users',
        title: 'Users',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'user',
        submenu: []
    },
    */
    {
        path: '/admin/users',
        title: 'Users',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'user',
        submenu: [
            {
                path: '/admin/users',   
                title: 'All Users',
                iconType: 'nzIcon',
                iconTheme: 'outline',
                icon: '',
                submenu: []
            }, 
            {
                path: '/admin/users/upcoming',
                title: 'Upcoming Expiry',
                iconType: 'nzIcon',
                iconTheme: 'outline',
                icon: '',
                submenu: []
            }  ,
            {
                path: '/admin/users/expired',
                title: 'Expired Subscriptions',
                iconType: 'nzIcon',
                iconTheme: 'outline',
                icon: '',
                submenu: []
            }    
        ] 
      },
      
    {
        path: '/admin/offlinepayments',
        title: 'Offline Payments',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'wallet',
        submenu: []
    },
    {
        path: '/admin/onlinepayments',
        title: 'Online Payments',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'wallet',
        submenu: []
    },
]    