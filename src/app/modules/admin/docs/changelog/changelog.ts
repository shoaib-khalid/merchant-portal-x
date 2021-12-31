/* eslint-disable max-len */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector       : 'changelog',
    templateUrl    : './changelog.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogComponent
{
    changelog: any[] = [
        // v0.0.8
        {
            version    : 'v0.0.8',
            releaseDate: 'Dec 30, 2021',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(ReceiptPage) Fix receipt currency',
                        '(OrderManagementPage) Fix delivery provider pickup date/time'
                    ]
                }
            ]
        },
        // v0.0.7
        {
            version    : 'v0.0.7',
            releaseDate: 'Dec 30, 2021',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(CreateStorePage) Limit store creation to 5 store',
                        '(OrderManagementPage) Add print invoice',
                        '(SnoozeFeature) Add snooze feature in menu'
                    ]
                },
                {
                    type: 'Fixed',
                    list: [
                        '(CreateStorePage) Fix extreme ip lookup, MP unable to detect location automatically',
                        '(OrderManagementPage) Fix default tab from history tab to new tab'
                    ]
                }
            ]
        },
        // v0.0.6
        {
            version    : 'v0.0.6',
            releaseDate: 'Dec 29, 2021',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(DashboardManagementPage) Fix wrong amount showed in This Week chart',
                        '(ProductCategoryPage) Fix issue total in product category pagination when visiting the page , before clicking the items per page',
                        '(OrderManagementPage) Fix sorting, remove export button, fixed where list is blank when search or do sorting',
                        '(StoreManagementPage) Remove schedule delivery fullfilment from store registry and store creation',
                        '(ChooseStorePage) Send pakistan vertical when filtering for store'
                    ]
                }
            ]
        },
        // v0.0.5
        {
            version    : 'v0.0.5',
            releaseDate: 'Dec 29, 2021',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(UserProfilePage) Fix update not working',
                        '(StoreManagementPage) Fix update store break hour timing',
                        '(StoreManagementPage) Fix update store logo',
                        '(DashboardManagementPage) Fix Dashboard Graph'
                    ]
                }
            ]
        },
        // v0.0.4
        {
            version    : 'v0.0.4',
            releaseDate: 'Dec 28, 2021',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(ManageCategory) Add product category',
                        '(InvoicePage) Add QR code details',
                    ]
                },
                {
                    type: 'Fixed',
                    list: [
                        '(InvoicePage) Fix invoice details',
                        '(OrderManagentPage) Add cancel order'
                    ]
                }
            ]
        },
        // v0.0.3
        {
            version    : 'v0.0.3',
            releaseDate: 'Dec 27, 2021',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(Changelog) Added the ChangeLog page'
                    ]
                },
                {
                    type: 'Fixed',
                    list: [
                        '(ManageProduct) Fixed: Trigger delete image at backend'
                    ]
                }
            ]
        },
        // v13.6.0
        // {
        //     version    : 'v13.6.0',
        //     releaseDate: 'Aug 31, 2021',
        //     changes    : [
        //         {
        //             type: 'Added',
        //             list: [
        //                 '(QuickChat) Added the QuickChat bar'
        //             ]
        //         },
        //         {
        //             type: 'Changed',
        //             list: [
        //                 '(dependencies) Updated Angular & Angular Material to v12.2.3',
        //                 '(dependencies) Updated various other packages',
        //                 '(layout) Separated the Settings drawer from the layout component'
        //             ]
        //         },
        //         {
        //             type: 'Fixed',
        //             list: [
        //                 '(@fuse/drawer) Final opacity of the overlay is not permanent due to player being destroyed right after the animation'
        //             ]
        //         }
        //     ]
        // }
    ];

    /**
     * Constructor
     */
    constructor()
    {
    }
}
