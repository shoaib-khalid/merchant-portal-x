import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from 'app/modules/merchant/dashboard/dashboard.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { DailyTopProducts, DailyTopProductsPagination, DetailedDailySales, DetailedDailySalesPagination, SummarySales, SummarySalesPagination } from './dashboard.types';
import { items } from 'app/mock-api/apps/file-manager/data';

@Component({
    selector       : 'dashboard',
    templateUrl    : './dashboard.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy
{
    store: Store;
    stores: Store[];
    currentStoreId: string;
    storeName: string = "";
    chartGithubIssues: ApexOptions = {};
    data: any;

    summarySalesCol = ["date","totalOrders","amountEarned"]
    summarySalesRow = [];
    summarySalesPagination: SummarySalesPagination;
    summarySalesDateRange = { start: '', end: ''};
    
    dailyTopProductsCol = ["date","productName","rank","totalTransaction"]
    dailyTopProductsRow = [];
    dailyTopProductsPagination: DailyTopProductsPagination;
    dailyTopProductsDateRange = { start: '', end: ''};
    
    detailedDailySalesCol = ["date","customerName","subTotal","serviceCharge","deliveryCharge","commission","total"]
    detailedDailySalesRow = [];
    detailedDailySalesPagination: DetailedDailySalesPagination;
    detailedDailySalesDateRange = { start: '', end: ''};

    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _dashboardService: DashboardService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _storesService: StoresService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for storeId
     */

     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store)=>{
                this.storeName = store.name;
            });

        this._storesService.storeControl.valueChanges
            .pipe(
                debounceTime(100),
                takeUntil(this._unsubscribeAll),
                switchMap((store: Store) => {
                    this.store = store;
                    this.currentStoreId = store.id;
                    this.storeName = store.name;
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                    return [];
                })
            )
            .subscribe();

        // Get the Daily Top Products
        this._dashboardService.dailyTopProducts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((dailyTopProducts: DailyTopProducts[])=>{
                dailyTopProducts.forEach(items=>{
                    items.topProduct.forEach(item => {
                        this.dailyTopProductsRow.push({
                            date: items.date, 
                            productName: item.productName, 
                            rank: item.rank, 
                            totalTransaction: item.totalTransaction
                        });
                    });
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Daily Top Products Pagination
        this._dashboardService.dailyTopProductsPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: DailyTopProductsPagination) => {

                // Update the pagination
                this.dailyTopProductsPagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Detailed Daily Sales
        this._dashboardService.detailedDailySales$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((dailyTopProducts: DetailedDailySales[])=>{
                dailyTopProducts.forEach(items => {
                    items.sales.forEach(item => {
                        this.detailedDailySalesRow.push({ 
                            date: items.date, 
                            customerName: item.customerName, 
                            subTotal: item.subTotal, 
                            serviceCharge: item.serviceCharge, 
                            deliveryCharge: item.deliveryCharge,
                            commission: item.commission,
                            total: item.total
                        });
                    });
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Detailed Daily Sales Pagination
        this._dashboardService.detailedDailySalesPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: DetailedDailySalesPagination) => {

                // Update the pagination
                this.detailedDailySalesPagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Summary Sales
        this._dashboardService.summarySales$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((summarySales: SummarySales[])=>{
                summarySales.forEach(items => {
                    this.summarySalesRow.push({ 
                        date: items.date, 
                        totalOrders: items.totalOrders, 
                        amountEarned: items.amountEarned
                    });
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });    
        
        // Get the Summary Sales Pagination
        this._dashboardService.summarySalesPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: SummarySalesPagination) => {

                // Update the pagination
                this.summarySalesPagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the data
                this.data = data;

                console.log("data.budgetDetails.rows", data.budgetDetails.rows)

                // Prepare the chart data
                this._prepareChartData();
            });

        // Attach SVG fill fixer to all ApexCharts
        window['Apex'] = {
            chart: {
                events: {
                    mounted: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    },
                    updated: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    }
                }
            }
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void
    {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
             .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
             .forEach((el) => {
                 const attrVal = el.getAttribute('fill');
                 el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
             });
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    private _prepareChartData(): void
    {
        // Github issues
        this.chartGithubIssues = {
            chart      : {
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'line',
                toolbar   : {
                    show: false
                },
                zoom      : {
                    enabled: false
                }
            },
            colors     : ['#64748B', '#94A3B8'],
            dataLabels : {
                enabled        : true,
                enabledOnSeries: [0],
                background     : {
                    borderWidth: 0
                }
            },
            grid       : {
                borderColor: 'var(--fuse-border)'
            },
            labels     : this.data.githubIssues.labels,
            legend     : {
                show: false
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%'
                }
            },
            series     : this.data.githubIssues.series,
            states     : {
                hover: {
                    filter: {
                        type : 'darken',
                        value: 0.75
                    }
                }
            },
            stroke     : {
                width: [3, 0]
            },
            tooltip    : {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis      : {
                axisBorder: {
                    show: false
                },
                axisTicks : {
                    color: 'var(--fuse-border)'
                },
                labels    : {
                    style: {
                        colors: 'var(--fuse-text-secondary)'
                    }
                },
                tooltip   : {
                    enabled: false
                }
            },
            yaxis      : {
                labels: {
                    offsetX: -16,
                    style  : {
                        colors: 'var(--fuse-text-secondary)'
                    }
                }
            }
        };
    }
}
