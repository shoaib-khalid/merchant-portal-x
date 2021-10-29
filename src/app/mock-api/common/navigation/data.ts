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
        id   : 'stores-management',
        title: 'Stores Management',
        type : 'collapsable',
        icon : 'heroicons_outline:office-building',
        children: [
            {
                id   : 'apps.stores-management.setup',
                title: 'Create Store',
                type : 'basic',
                link : '/stores/choose-vertical',
                exactMatch: true
            },
            {
                id   : 'apps.stores-management.list',
                title: 'Choose Store',
                type : 'basic',
                link : '/stores',
                exactMatch: true
            }
        ],
    },
    {
        id   : 'products-management',
        title: 'Products Management',
        type : 'collapsable',
        icon : 'heroicons_outline:cube',
        children: [
            {
                id   : 'apps.ecommerce.inventory',
                title: 'Inventory',
                type : 'basic',
                link : '/products',
                exactMatch: true
            },
            {
                id   : 'apps.ecommerce.inventory',
                title: 'Product Category',
                type : 'basic',
                link : '/products',
                exactMatch: true
            }
        ],
    },
    {
        id   : 'orders-management',
        title: 'Orders Management',
        type : 'basic',
        icon : 'heroicons_outline:shopping-cart',
        link : '/orders'
    },
    {
        id   : 'promo-management',
        title: 'Discounts / Promotion Management',
        type : 'basic',
        icon : 'heroicons_outline:gift',
        link : '/discounts'
    },
    {
        id   : 'social-media',
        title: 'Social Media',
        type : 'basic',
        icon : 'heroicons_outline:chat-alt-2',
        link : '/user-channels'
    },
    {
        id   : 'customer-support',
        title: 'Customer Support',
        type : 'basic',
        icon : 'heroicons_outline:support',
        link : '/customer-support'
    }
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
