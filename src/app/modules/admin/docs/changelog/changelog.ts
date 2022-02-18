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
        // v0.0.23
        {
            version    : 'v0.0.23',
            releaseDate: 'Feb 18, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(ProductDiscountManagement) Clear the input for insert tier,refactor code in product disocunt upon create discount',
                        '(ClearLogs) Remove unnecessary logs'
                    ]
                }
            ]
        },
        // v0.0.22
        {
            version    : 'v0.0.22',
            releaseDate: 'Feb 16, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(ProductManagement) Allow variant and combo on both FnB and Ecommerce',
                        '(CustomTimeSelector) Fix UI for time selection',
                        '(ProductManagement) Remove stock on FnB',
                    ]
                },
                {
                    type: 'Added',
                    list: [
                        '(ProductManagement) Allow variant and combo on both FnB and Ecommerce',
                        '(ProductManagement) Add catagory filter on product and product combo',
                    ]
                }
            ]
        },
        // v0.0.21
        {
            version    : 'v0.0.21',
            releaseDate: 'Feb 15, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(TimeSelectionUI) Fix time selection responsiveness',
                    ]
                },
                {
                    type: 'Added',
                    list: [
                        '(OrderManagement) Edit quantity of orders (New Order Only)',
                    ]
                }
            ]
        },
        // v0.0.20
        {
            version    : 'v0.0.20',
            releaseDate: 'Feb 14, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(StoreManagement) Existing store edit image',
                        '(DashboardManagement) Fix pagination UI for mobile',
                        '(ProductManagement) Fix pagination UI for mobile',
                    ]
                }
            ]
        },
        // v0.0.19
        {
            version    : 'v0.0.19',
            releaseDate: 'Feb 11, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(ProductManagement) Fix product management',
                        '(DiscountManagement) Fix pagination UI for mobile',
                        '(StoreManagement) Fix pagination UI for mobile',
                        '(StoreCreate) Get country from user service when creating store'
                    ]
                }
            ]
        },
        // v
        // v0.0.18
        {
            version    : 'v0.0.18',
            releaseDate: 'Feb 09, 2022',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(SignUp) Auto detect and store country on store creation',
                        '(OrderManagement) Create bulk order for delivery provider pickup',
                        '(StoreCreateAndEdit) Add favicon, banners and logo from new backend endpoint'
                    ]
                },
                {
                    type: 'Fix',
                    list: [
                        '(ProductVariant) Fix where main product input fields can be edited even it has variants',
                        '(OrderDiscount) Remove product discount from order'
                    ]
                }
            ]
        },
        // v0.0.17
        {
            version    : 'v0.0.17',
            releaseDate: 'Feb 09, 2022',
            changes    : [
                {
                    type: 'Fix',
                    list: [
                        '(ProductVariant) Fix product variant'
                    ]
                }
            ]
        },
        // v0.0.16
        {
            version    : 'v0.0.16',
            releaseDate: 'Jan 27, 2022',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(CustomTimingInput) Create Custom Timing Input for Create store and Edit Store',
                        '(OrderDetailsPage) Add special instruction and customer notes'
                    ]
                }
            ]
        },
        // v0.0.15
        {
            version    : 'v0.0.15',
            releaseDate: 'Jan 25, 2022',
            changes    : [
                {
                    type: 'Added',
                    list: [
                        '(CreateProductDiscount) Create Product Discount'
                    ]
                },
                {
                    type: 'Fix',
                    list: [
                        '(Favicon) Fix favicon'
                    ]
                }
            ]
        },
        // v0.0.14
        {
            version    : 'v0.0.14',
            releaseDate: 'Jan 24, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(CreateStoreUI) Fix create store UI'
                    ]
                }
            ]
        },
        // v0.0.13
        {
            version    : 'v0.0.13',
            releaseDate: 'Jan 13, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(ReceiptPage) Add capped description to receipt page',
                        '(CreateStorePage) Fix UI for error card, centralise the card container',
                        '(DashboardPage) Fix top product test from number to ranks. Eg: 1st, 2nd, 3rd',
                        '(DashboardPage) Use new endpoint for chart and overview, handle dashboard services not resolved when choose different store from dropdown'
                    ]
                },
                {
                    type: 'Added',
                    list: [
                        '(OrderDetailsPage) Add Customer detail, rider details & delivery info',
                        '(OrderDetailsPage) Add order details such as tracking url & consignment note',
                        '(DashboardPage) Add download report for every report type',
                    ]
                },
                {
                    type: 'Bugged',
                    list: [
                        '(DashboardPage) Fix graph data, data on graph limited to pagination causing inaccurate data being displayed - still need backend to fix',
                    ]
                }
            ]
        },
        // v0.0.12
        {
            version    : 'v0.0.12',
            releaseDate: 'Jan 10, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(EditPagePage) Fix edit store upload image',
                        '(DiscountPage) Fix disabled percentage more than 100%',
                        '(HomePage) Redirect to signin'
                    ]
                }
            ]
        },
        // v0.0.11
        {
            version    : 'v0.0.11',
            releaseDate: 'Jan 07, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(DashboardPage) Fix store dashboard data',
                        '(DiscountPage) Fix disabled percentage more than 100%'
                    ]
                }
            ]
        },
        // v0.0.10
        {
            version    : 'v0.0.10',
            releaseDate: 'Jan 06, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(StoreEditPage) Fix store self delivery states on edit store page'
                    ]
                }
            ]
        },
        // v0.0.9
        {
            version    : 'v0.0.9',
            releaseDate: 'Jan 05, 2022',
            changes    : [
                {
                    type: 'Fixed',
                    list: [
                        '(DashboardPage) Fix report data when changing store. (No need to refresh)',
                        '(ReceiptPage) Fix capped amount currency. (Previously hardcoded $)'
                    ]
                },
                {
                    type: 'Added',
                    list: [
                        '(DashboardPage) Add Net total, Commission, Delivery Charges & Service Charges into Detailed Sales',
                        '(ProfileSettingPage) Implement new UI for profile setting',
                        '(ProfileSettingPage) Implement reset password at profile setting',
                    ]
                }
            ]
        },
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
