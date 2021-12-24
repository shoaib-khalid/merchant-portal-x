/* tslint:disable:max-line-length */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'dashboard',
        title: 'Dashboard',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/dashboard'
    },
    {
        id   : 'store-management',
        title: 'Store Management',
        type : 'collapsable',
        icon : 'heroicons_outline:office-building',
        children: [
            {
                id   : 'app.create-store',
                title: 'Create Store',
                type : 'basic',
                link : '/stores/choose-vertical',
                exactMatch: true
            },
            {
                id   : 'app.manage-store',
                title: 'Manage Store',
                type : 'basic',
                link : '/stores',
                exactMatch: true
            }
        ],
    },
    {
        id   : 'product-management',
        title: 'Product Management',
        type : 'collapsable',
        icon : 'heroicons_outline:cube',
        children: [
            {
                id   : 'app.manage-product',
                title: 'Manage Product',
                type : 'basic',
                link : '/products/inventory',
                exactMatch: true
            },
            {
                id   : 'app.manage-category',
                title: 'Manage Category',
                type : 'basic',
                link : '/products/categories',
                exactMatch: true
            }
        ],
    },
    {
        id   : 'order-management',
        title: 'Order Management',
        type : 'basic',
        icon : 'heroicons_outline:shopping-cart',
        link : '/orders'
    },
    {
        id   : 'discount-management',
        title: 'Discount Management',
        type : 'basic',
        icon : 'heroicons_outline:gift',
        link : '/discounts'
    },
    // {
    //     id   : 'social-media',
    //     title: 'Social Media',
    //     type : 'collapsable',
    //     icon : 'heroicons_outline:chat-alt-2',
    //     children: [
    //         {
    //             id   : 'apps.flow.management',
    //             title: 'Flows Management',
    //             type : 'basic',
    //             link : '/social-media',
    //             exactMatch: true
    //         },
    //         {
    //             id   : 'apps.channel.management',
    //             title: 'Channels Management',
    //             type : 'basic',
    //             link : '/social-media/channels',
    //             exactMatch: true
    //         }
    //     ]
    // },
    // {
    //     id   : 'customer-support',
    //     title: 'Customer Support',
    //     type : 'collapsable',
    //     icon : 'heroicons_outline:support',
    //     children: [
    //         {
    //             id   : 'customer-support.list',
    //             title: 'Customer Database',
    //             type : 'basic',
    //             link : '/customer-support/list',
    //             exactMatch: true
    //         },
    //         {
    //             id   : 'manage-agent.list',
    //             title: 'Agent Management',
    //             type : 'basic',
    //             link : '/customer-support/manage-agent',
    //             exactMatch: true
    //         },
    //     ]
    // }
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
