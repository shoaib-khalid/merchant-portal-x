import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { merge, of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from 'app/modules/merchant/dashboard/dashboard.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { DailyTopProducts, DailyTopProductsPagination, DetailedDailySales, DetailedDailySalesPagination, Settlement, SettlementPagination, SummarySales, SummarySalesPagination, TotalSalesDaily, TotalSalesMonthly, TotalSalesTotal, TotalSalesWeekly } from './dashboard.types';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import * as XLSX from 'xlsx';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';

@Component({
    selector       : 'dashboard',
    templateUrl    : './dashboard.component.html',
    styles       : [
        `
        /* to truncate long text  */
        .truncate-cell {
            max-width: 130px; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        /* to break long words (currently not being used) */
        .mat-cell-break-word {
            white-space: normal;
            word-wrap: break-word;
            max-width: 50px;
        }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy
{
    @ViewChild("dailyTopProductsPaginator", {read: MatPaginator}) private _dailyTopProductsPaginator: MatPaginator;
    @ViewChild("detailedDailySalesPaginator", {read: MatPaginator}) private _detailedDailySalesPaginator: MatPaginator;
    @ViewChild("summarySalesPaginator", {read: MatPaginator}) private _summarySalesPaginator: MatPaginator;
    @ViewChild("settlementPaginator", {read: MatPaginator}) private _settlementPaginator: MatPaginator;
    
    store: Store;
    stores: Store[];
    currentStoreId: string;
    storeName: string = "";
    salesChart: ApexOptions = {};
    data: any;
    seriesChart: any;
    overviewChart: any;
    weeklyGraph: boolean = true;
    // topProductChart:any;
    
    // ------------------------
    // Summary Sales Properties
    // ------------------------

    summarySalesCol = ["date","totalOrders","amountEarned"]
    summarySalesRow = [];
    summarySalesPagination: SummarySalesPagination;

    summarySalesDateRange: any = {
        start : null,
        end: null
    }
    summarySalesDateInputStartControl: FormControl = new FormControl();
    summarySalesDateInputEndControl: FormControl = new FormControl();
    

    // -----------------------------
    // Daily Top Products Properties
    // -----------------------------

    dailyTopProductsCol = ["date","productName","rank","totalTransaction"]
    dailyTopProductsRow = [];
    dailyTopProductsPagination: DailyTopProductsPagination;
    dailyTopProductsDateRange: any = {
        start : null,
        end: null
    }
    dailyTopProductsDateInputStart: FormControl = new FormControl();
    dailyTopProductsDateInputEnd: FormControl = new FormControl();
    
    // -------------------------------
    // Daily Detailed Sales Properties
    // -------------------------------

    detailedDailySalesCol = ["date","customerName","total","subTotal", "appliedDiscount","serviceCharge","deliveryCharge", "deliveryDiscount","commission","netTotal"]
    detailedDailySalesRow = [];
    detailedDailySalesPagination: DetailedDailySalesPagination;
    detailedDailySalesDateRange: any = {
        start : null,
        end: null
    }
    detailedDailySalesDateInputStart: FormControl = new FormControl();
    detailedDailySalesDateInputEnd: FormControl = new FormControl();

    // -------------------------------
    // Settlements Properties
    // -------------------------------

    settlementCol = ["payoutDate","startDate","cutoffDate","grossAmount","serviceCharges","selfDeliveryFee","commission","netAmount"]
    settlementRow = [];
    settlementPagination: SettlementPagination;
    settlementDateRange: any = {
        start : null,
        end: null
    }
    settlementDateInputStart: FormControl = new FormControl();
    settlementDateInputEnd: FormControl = new FormControl();


    completeCompletionStatus = ["DELIVERED_TO_CUSTOMER"];
    pendingCompletionStatus = [];
    failedCompletionStatus = ["REQUESTING_DELIVERY_FAILED","PAYMENT_FAILED","CANCELED_BY_CUSTOMER","FAILED","REJECTED_BY_STORE","CANCELED_BY_MERCHANT"];

    totalSalesTotalRow = [];
    totalSalesDailyRow = [];
    totalSalesWeeklyRow = [];
    totalSalesMonthlyRow = [];

    sumTotalCompleted: number = 0;
    sumTotalPending: number = 0;
    sumTotalFailed: number = 0;

    sumDailyCompleted: number = 0;
    sumDailyPending: number = 0;
    sumDailyFailed: number = 0;

    sumWeeklyCompleted: number = 0;
    sumWeeklyPending: number = 0;
    sumWeeklyFailed: number = 0;

    sumMonthlyCompleted: number = 0;
    sumMonthlyPending: number = 0;
    sumMonthlyFailed: number = 0;

    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currencySymbol: string;

    lastMonday: any;

    topProductThisWeekRow = [];
    topProductLastWeekRow = [];

    firstThisWeek: string;
    secondThisWeek: string;
    thirdThisWeek: string;

    firstLastWeek: string;
    secondLastWeek: string;
    thirdLastWeek: string;

    overviewThisWeekArr = [];
    overviewLastWeekArr = [];

    sumThisWeekCompleted: number = 0;
    sumThisWeekPending: number = 0;
    sumThisWeekFailed: number = 0;

    sumLastWeekCompleted: number = 0;
    sumLastWeekPending: number = 0;
    sumLastWeekFailed: number = 0;
    
    thisWeekChartArr = [];
    lastWeekChartArr = [];

    thisWeekTotalCompleted: number = 0;
    thisWeekTotalPending: number = 0;
    thisWeekTotalFailed: number = 0;

    lastWeekTotalCompleted: number = 0;
    lastWeekTotalPending: number = 0;
    lastWeekTotalFailed: number = 0;


    thisWeekDayChartCompleted = [0,0,0,0,0,0,0];
    thisWeekDayChartPending = [0,0,0,0,0,0,0];
    thisWeekDayChartFailed = [0,0,0,0,0,0,0];

    lastWeekDayChartCompleted = [0,0,0,0,0,0,0];
    lastWeekDayChartPending = [0,0,0,0,0,0,0];
    lastWeekDayChartFailed = [0,0,0,0,0,0,0];

    summarySalesFileExel= 'SummarySales.xlsx';
    dailySalesFileExel= 'DailySales.xlsx';
    dailyTopProductFileExel= 'DailyTopProduct.xlsx';
    settlementFileExel= 'Settlement.xlsx';

    summarySalesPageSize: number = 10;
    detailedDailySalesPageSize: number = 10;
    dailyTopProductsPageSize: number = 10;
    settlementPageSize: number = 10;
    currentScreenSize: any;

    /**
     * Constructor
     */
    constructor(
        private _dashboardService: DashboardService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _storesService: StoresService,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,

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
        
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store)=>{

                if (store) {                    
                    this.storeName = store.name;
                    this.currencySymbol = store.regionCountry.currencySymbol;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
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
                    this.reload();
                    return [];
                })
                
            )
            .subscribe();

        // Get the Daily Top Products
        this._dashboardService.dailyTopProducts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((dailyTopProducts: DailyTopProducts[])=>{
                this.dailyTopProductsRow = [];
                dailyTopProducts.forEach(item=>{
                    this.dailyTopProductsRow.push({
                        date: item.date, 
                        productName: item.name, 
                        rank: item.ranking, 
                        totalTransaction: item.totalOrders
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
            .subscribe((detailedDailySales: DetailedDailySales[])=>{
                this.detailedDailySalesRow = [];
                detailedDailySales.forEach(item => {
                    this.detailedDailySalesRow.push({ 
                        date: item.created, 
                        customerName: item.customer.name, 
                        subTotal: item.subTotal, 
                        serviceCharge: item.storeServiceCharges, 
                        deliveryCharge: item.deliveryCharges,
                        commission: item.klCommission,
                        total: item.total,
                        netTotal: item.storeShare,
                        deliveryDiscount: item.deliveryDiscount,
                        appliedDiscount: item.appliedDiscount,
                        deliveryType: item.deliveryType
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
                this.summarySalesRow = [];
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


        // Get the Total Sales Total
        this._dashboardService.totalSalesTotal$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesTotal: TotalSalesTotal[])=>{
                totalSalesTotal.forEach(items => {
                    this.totalSalesTotalRow.push({ 
                        completionStatus: items.completionStatus,
                        total: items.total,
                    });

                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });      

        // Get the Total Sales Daily
        this._dashboardService.totalSalesDaily$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesDaily: TotalSalesDaily[])=>{
                totalSalesDaily.forEach(items => {
                    this.totalSalesDailyRow.push({ 
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });  

        // Get the Total Sales Weekly
        this._dashboardService.totalSalesWeekly$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesWeekly: TotalSalesWeekly[])=>{
                totalSalesWeekly.forEach(items => {
                    this.totalSalesWeeklyRow.push({ 
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });  

        // Get the Total Sales Monthly
        this._dashboardService.totalSalesMonthly$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesMonthly: TotalSalesMonthly[])=>{
                totalSalesMonthly.forEach(items => {
                    this.totalSalesMonthlyRow.push({ 
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });      
        

        // Get the Settlement
        this._dashboardService.settlement$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((settlement: Settlement[])=>{
                this.settlementRow = [];
                settlement.forEach(items => {
                    let tempSelfDeliveryFee = 0;
                    if (items.totalSelfDeliveryFee == null)
                        tempSelfDeliveryFee = 0;
                    else 
                        tempSelfDeliveryFee = items.totalSelfDeliveryFee
                    this.settlementRow.push({ 
                        payoutDate: items.settlementDate,
                        startDate: items.cycleStartDate,
                        cutoffDate: items.cycleEndDate,
                        grossAmount: items.totalTransactionValue,
                        serviceCharges: items.totalServiceFee,
                        selfDeliveryFee: tempSelfDeliveryFee,
                        commission: items.totalCommisionFee,
                        netAmount: items.totalStoreShare
                    });
                });
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });    
        
        // Get the Settlement Pagination
        this._dashboardService.settlementPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: SettlementPagination) => {

                // Update the pagination
                this.settlementPagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Sum up Total Sales Total
        this.totalSalesTotalRow.forEach(a => {
            
            if (this.completeCompletionStatus.includes(a.completionStatus))
                this.sumTotalCompleted += a.total;
            
            else if (this.failedCompletionStatus.includes(a.completionStatus))
                this.sumTotalFailed += a.total;
            
            else
                this.sumTotalPending += a.total;

        })
        
        // Sum up Total Sales Daily
        this.totalSalesDailyRow.forEach(a => {
            
            if (this.completeCompletionStatus.includes(a.completionStatus))
                this.sumDailyCompleted += a.total;
            
            else if (this.failedCompletionStatus.includes(a.completionStatus))
                this.sumDailyFailed += a.total;
            
            else
                this.sumDailyPending += a.total;

        })

        // Sum up Total Sales Weekly
        this.totalSalesWeeklyRow.forEach(a => {
            
            if (this.completeCompletionStatus.includes(a.completionStatus))
                this.sumWeeklyCompleted += a.total;
                
            else if (this.failedCompletionStatus.includes(a.completionStatus))
                this.sumWeeklyFailed += a.total;
                
            else
                this.sumWeeklyPending += a.total;
                
        })

        // Sum up Total Sales Monthly 
        this.totalSalesMonthlyRow.forEach(a => {
            
            if (this.completeCompletionStatus.includes(a.completionStatus))
                this.sumMonthlyCompleted += a.total;
            
            else if (this.failedCompletionStatus.includes(a.completionStatus))
                this.sumMonthlyFailed += a.total;
            
            else
                this.sumMonthlyPending += a.total;

        })

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
        
        // -------------------------------
        // Summary Sales Date Range Input
        // -------------------------------

        // Subscribe to start date input field value changes 
        this.summarySalesDateInputStartControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    
                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.summarySalesDateRange.start = formattedDate;
                        
                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to end date input field value changes
        this.summarySalesDateInputEndControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.summarySalesDateRange.end = formattedDate;

                    return this._dashboardService.getSummarySales(this.storeId$, 0, this.summarySalesPageSize, 'created', 'asc','', 
                                                                    this.summarySalesDateRange.start, this.summarySalesDateRange.end);
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Daily Detailed Sales Date Range Input
        // -------------------------------
        
        // Subscribe to start date input field value changes 
        this.detailedDailySalesDateInputStart.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    
                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.detailedDailySalesDateRange.start = formattedDate;
                        
                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to end date input field value changes
        this.detailedDailySalesDateInputEnd.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.detailedDailySalesDateRange.end = formattedDate;

                    return this._dashboardService.getDetailedDailySales(this.storeId$, 0, this.detailedDailySalesPageSize, 'created', 'asc', 
                                                                            this.detailedDailySalesDateRange.start, this.detailedDailySalesDateRange.end);
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Daily Top Products Date Range Input
        // -------------------------------

        // Subscribe to start date input field value changes 
        this.dailyTopProductsDateInputStart.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    
                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.dailyTopProductsDateRange.start = formattedDate;
                        
                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to end date input field value changes
        this.dailyTopProductsDateInputEnd.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.dailyTopProductsDateRange.end = formattedDate;

                    return this._dashboardService.getDailyTopProducts(this.storeId$, 0, this.dailyTopProductsPageSize, 'date', 'asc', "",
                                                                            this.dailyTopProductsDateRange.start, this.dailyTopProductsDateRange.end);
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Settlement Date Range Input
        // -------------------------------

        // Subscribe to start date input field value changes 
        this.settlementDateInputStart.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    
                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.settlementDateRange.start = formattedDate;
                        
                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to end date input field value changes
        this.settlementDateInputEnd.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // reformat date 
                    const format = 'yyyy-MM-dd';
                    let myDate = query;
                    const locale = 'en-MY';
                    let formattedDate = formatDate(myDate, format, locale);
                    
                    this.settlementDateRange.end = formattedDate;

                    return this._dashboardService.getSettlement(this.storeId$, 0, this.settlementPageSize, 'created', 'cycleStartDate',
                                                                            this.settlementDateRange.start, this.settlementDateRange.end);
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        //-----------------------------
        // Get dates for This Week
        //-----------------------------
        
        // get last Monday and today's date
        let lastMonday = this.getPreviousMonday()
        let today = new Date();
        let locale = 'en-MY';
        
        // reformat date 
        const format = 'yyyy-MM-dd';
        let formattedLastMonday = formatDate(lastMonday, format, locale);
        let formattedToday = formatDate(today, format, locale);

        // -------------------------------
        // Top Product This Week
        // -------------------------------

        this._dashboardService.getDailyTopProducts(this.storeId$, 0, 10, 'date', 'desc', "",
        formattedLastMonday, formattedToday)
        .subscribe(response => {
            
            this.topProductThisWeekRow = []
            
            response['data'].content.forEach(product => {
                this.topProductThisWeekRow.push({
                    name : product.name,
                    rank : product.ranking

                })
            })

            // sort the array by rank
            this.topProductThisWeekRow.sort(function (x, y) {
                return x.rank - y.rank;
            });

            // assign product name to the top three
            this.firstThisWeek = this.topProductThisWeekRow[0]?.name;
            this.secondThisWeek = this.topProductThisWeekRow[1]?.name;
            this.thirdThisWeek = this.topProductThisWeekRow[2]?.name;

        })

        // // -------------------------------
        // // Graph & Overview This Week
        // // -------------------------------

        this._dashboardService.getWeeklyGraph(this.storeId$, formattedLastMonday, formattedToday)
        .subscribe(response => {
            this.overviewThisWeekArr = [];
            response['dashboardGraph'].forEach(item => {
                this.overviewThisWeekArr.push({ 
                    completionStatus: item.completionStatus,
                    total: item.total,
                    //get the day of the week
                    day: new Date(item.date).getDay()
                });
            });
            // Sum up This Week Total and plot the Chart based on Day
            this.overviewThisWeekArr.forEach(a => {
            
            if (this.completeCompletionStatus.includes(a.completionStatus)){

                this.sumThisWeekCompleted += a.total;
                this.thisWeekDayChartCompleted[a.day] += a.total;
            }
            
            else if (this.failedCompletionStatus.includes(a.completionStatus)){

                this.sumThisWeekFailed += a.total;
                this.thisWeekDayChartFailed[a.day] += a.total;
            }
            
            else {

                this.sumThisWeekPending += a.total;
                this.thisWeekDayChartPending[a.day] += a.total;
            }

            })

            this._prepareChartData();
        })

        //-----------------------------
        // Get dates for last week
        //-----------------------------

        // get this week monday
        let lastWeekStart = this.getPreviousMonday()
        
        // set lastWeekStartFixed to last week monday
        const lastWeekStartFixed = new Date(lastWeekStart.setDate(lastWeekStart.getDate() - 7)); 
        
        // set lastWeekEnd to end of last week        
        let lastWeekEnd = new Date(lastWeekStart.setDate(lastWeekStart.getDate() + 6));

        // reformat date 
        let formattedLastWeekStart = formatDate(lastWeekStartFixed, format, locale);
        let formattedLastWeekEnd = formatDate(lastWeekEnd, format, locale);

        // -------------------------------
        // Top Product Last Week
        // -------------------------------

        this._dashboardService.getDailyTopProducts(this.storeId$, 0, 10, 'date', 'desc', "",
        formattedLastWeekStart, formattedLastWeekEnd)
        .subscribe(response => {
            
            this.topProductLastWeekRow = []

            response['data'].content.forEach(product => {
                this.topProductLastWeekRow.push({
                    name : product.name,
                    rank : product.ranking

                })
            })

            // sort the array by rank
            this.topProductLastWeekRow.sort(function (x, y) {
                return x.rank - y.rank;
            });
            
            // assign product name to the top three
            this.firstLastWeek = this.topProductLastWeekRow[0]?.name;
            this.secondLastWeek = this.topProductLastWeekRow[1]?.name;
            this.thirdLastWeek = this.topProductLastWeekRow[2]?.name;
            
        })
        
        // // -------------------------------
        // // Graph & Overview Last Week
        // // -------------------------------

        this._dashboardService.getWeeklyGraph(this.storeId$, formattedLastWeekStart, formattedLastWeekEnd)
        .subscribe(response => {
            this.overviewLastWeekArr = [];
            response['dashboardGraph'].forEach(item => {
                this.overviewLastWeekArr.push({ 
                    completionStatus: item.completionStatus,
                    total: item.total,
                    //get the day of the week
                    day: new Date(item.date).getDay()
                });
            });

            // Sum up Last Week Total and plot the Chart based on Day
            this.overviewLastWeekArr.forEach(a => {
            
                if (this.completeCompletionStatus.includes(a.completionStatus)){

                    this.sumLastWeekCompleted += a.total;
                    this.lastWeekDayChartCompleted[a.day] += a.total;
                    
                }
                
                else if (this.failedCompletionStatus.includes(a.completionStatus)){

                    this.sumLastWeekFailed += a.total;
                    this.lastWeekDayChartFailed[a.day] += a.total;
                }
                
                else {

                    this.sumLastWeekPending += a.total;
                    this.lastWeekDayChartPending[a.day] += a.total;
                }
            })

            this._prepareChartData();
            
        })


        this._prepareChartData();

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        setTimeout(() => {
            if ( this._dailyTopProductsPaginator )
            {

                // Mark for check
                this._changeDetectorRef.markForCheck();


                // Get customers if sort or page changes
                merge(this._dailyTopProductsPaginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;

                        this.dailyTopProductsPageSize = this._dailyTopProductsPaginator.pageSize;

                        if (this.dailyTopProductsDateRange.start == null && this.dailyTopProductsDateRange.end == null)
                            return this._dashboardService.getDailyTopProducts(this.storeId$, this._dailyTopProductsPaginator.pageIndex, this._dailyTopProductsPaginator.pageSize, "date", "asc");
                        else
                            return this._dashboardService.getDailyTopProducts(this.storeId$, this._dailyTopProductsPaginator.pageIndex, this._dailyTopProductsPaginator.pageSize, "date", "asc", "",
                                                                                    this.dailyTopProductsDateRange.start, this.dailyTopProductsDateRange.end);

                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
            if ( this._detailedDailySalesPaginator )
            {

                // Mark for check
                this._changeDetectorRef.markForCheck();


                // Get customers if sort or page changes
                merge(this._detailedDailySalesPaginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;

                        this.detailedDailySalesPageSize = this._detailedDailySalesPaginator.pageSize;

                        if (this.detailedDailySalesDateRange.start == null && this.detailedDailySalesDateRange.end == null)
                            return this._dashboardService.getDetailedDailySales(this.storeId$, this._detailedDailySalesPaginator.pageIndex, this._detailedDailySalesPaginator.pageSize, "created", "asc");
                        else
                            return this._dashboardService.getDetailedDailySales(this.storeId$, this._detailedDailySalesPaginator.pageIndex, this._detailedDailySalesPaginator.pageSize, "created", "asc", 
                                                                                    this.detailedDailySalesDateRange.start, this.detailedDailySalesDateRange.end);
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
            if ( this._summarySalesPaginator )
            {

                // Mark for check
                this._changeDetectorRef.markForCheck();


                // Get customers if sort or page changes
                merge(this._summarySalesPaginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;

                        this.summarySalesPageSize = this._summarySalesPaginator.pageSize;

                        if (this.summarySalesDateRange.start == null && this.summarySalesDateRange.end == null)
                            return this._dashboardService.getSummarySales(this.storeId$, this._summarySalesPaginator.pageIndex, this._summarySalesPaginator.pageSize, "date", "asc");
                        else
                            return this._dashboardService.getSummarySales(this.storeId$, this._summarySalesPaginator.pageIndex, this._summarySalesPaginator.pageSize, "date", "asc", "", 
                                                                            this.summarySalesDateRange.start, this.summarySalesDateRange.end);

                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
            if ( this._settlementPaginator )
            {

                // Mark for check
                this._changeDetectorRef.markForCheck();


                // Get customers if sort or page changes
                merge(this._settlementPaginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;

                        this.settlementPageSize = this._settlementPaginator.pageSize;

                        if (this.settlementDateRange.start == null && this.settlementDateRange.end == null)
                            return this._dashboardService.getSettlement(this.storeId$, this._settlementPaginator.pageIndex, this._settlementPaginator.pageSize, "date", "cycleStartDate");
                        else
                            return this._dashboardService.getSettlement(this.storeId$, this._settlementPaginator.pageIndex, this._settlementPaginator.pageSize, "date", "cycleStartDate", 
                                                                            this.settlementDateRange.start, this.settlementDateRange.end);

                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
        }, 0);
    }

    getPreviousMonday()
    {
        let today = new Date();
        
        // get the day of date (0-6)
        let day = today.getDay();
        let prevMonday = new Date();

        // if today is Monday, return today's date
        if(today.getDay() == 0){
            // prevMonday.setDate(date.getDate() - 7);
            return today;
        }
        // else, set prevMonday to previous Monday's date
        else{
            prevMonday.setDate(today.getDate() - (day-1));
        }
    
        return prevMonday;
    }

    reload(){
        this._router.routeReuseStrategy.shouldReuseRoute = () => false;
        this._router.onSameUrlNavigation = 'reload';
    }


    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
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
        
        this.seriesChart  = {
            'this-week': [
                {
                    name: 'Completed',
                    type: 'line',
                    data: [this.thisWeekDayChartCompleted[1], this.thisWeekDayChartCompleted[2], this.thisWeekDayChartCompleted[3], 
                    this.thisWeekDayChartCompleted[4], this.thisWeekDayChartCompleted[5], this.thisWeekDayChartCompleted[6], this.thisWeekDayChartCompleted[0]]
                },
                {
                    name: 'Pending',
                    type: 'line',
                    data: [this.thisWeekDayChartPending[1], this.thisWeekDayChartPending[2], this.thisWeekDayChartPending[3], 
                    this.thisWeekDayChartPending[4], this.thisWeekDayChartPending[5], this.thisWeekDayChartPending[6], this.thisWeekDayChartPending[0]]
                },
                {
                    name: 'Failed',
                    type: 'column',
                    data: [this.thisWeekDayChartFailed[1], this.thisWeekDayChartFailed[2], this.thisWeekDayChartFailed[3], 
                    this.thisWeekDayChartFailed[4], this.thisWeekDayChartFailed[5], this.thisWeekDayChartFailed[6], this.thisWeekDayChartFailed[0]]
                }
            ],
            'last-week': [
                {
                    name: 'Completed',
                    type: 'line',
                    // data: [9, 8, 10, 12, 7, 11, 15]
                    data: [this.lastWeekDayChartCompleted[1], this.lastWeekDayChartCompleted[2], this.lastWeekDayChartCompleted[3], 
                    this.lastWeekDayChartCompleted[4], this.lastWeekDayChartCompleted[5], this.lastWeekDayChartCompleted[6], this.lastWeekDayChartCompleted[0]],
                    
                    
                },
                {
                    name: 'Pending',
                    type: 'line',
                    data: [this.lastWeekDayChartPending[1], this.lastWeekDayChartPending[2], this.lastWeekDayChartPending[3], 
                    this.lastWeekDayChartPending[4], this.lastWeekDayChartPending[5], this.lastWeekDayChartPending[6], this.lastWeekDayChartPending[0]]
                },
                {
                    name: 'Failed',
                    type: 'column',
                    data: [this.lastWeekDayChartFailed[1], this.lastWeekDayChartFailed[2], this.lastWeekDayChartFailed[3], 
                    this.lastWeekDayChartFailed[4], this.lastWeekDayChartFailed[5], this.lastWeekDayChartFailed[6], this.lastWeekDayChartFailed[0]]
                }
            ]
        }

        // Sales summary
        this.salesChart = {
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
                },
            },
            colors     : ['#3b82f6', '#f59e0b', '#ef4444'],
            dataLabels : {
                enabled        : true,
                enabledOnSeries: [0, 1],
                background     : {
                    borderWidth: 0
                }
            },
            grid       : {
                borderColor: 'var(--fuse-border)'
            },
            labels     : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            legend     : {
                show: false
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%'
                }
            },
            series     : this.seriesChart,
            states     : {
                hover: {
                    filter: {
                        type : 'darken',
                        value: 0.75
                    }
                }
            },
            stroke     : {
                width: [2, 2, 0]
            },
            tooltip    : {
                y: [
                  {
                    title: {
                      formatter: function(val) {
                        return val;
                      }
                    }
                  },
                  {
                    title: {
                      formatter: function(val) {
                        return val;
                      }
                    }
                  },
                  {
                    title: {
                      formatter: function(val) {
                        return val;
                      }
                    }
                  }
                ]
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
                    },
                    formatter: function(val) {
                        return val.toFixed(0)
                    },
                },
                tickAmount: 1,
            },
            markers: {
                size: 0,
                hover: {
                  sizeOffset: 6
                }
              }
        };
    }
    exportSummarySalesToExcel(): void
    {
    /* pass here the table id */
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */  
    XLSX.writeFile(wb, this.summarySalesFileExel);

    }

    exportDailySalesToExcel(): void
    {
    /* pass here the table id */
    let element = document.getElementById('dailySales-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */  
    XLSX.writeFile(wb, this.dailySalesFileExel);

    }

    exportDailyTopProductToExcel(): void
    {
    /* pass here the table id */
    let element = document.getElementById('dailyTopProduct-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */  
    XLSX.writeFile(wb, this.dailyTopProductFileExel);

    }

    exportSettlementToExcel(): void
    {
    /* pass here the table id */
    let element = document.getElementById('settlement-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */  
    XLSX.writeFile(wb, this.settlementFileExel);

    }
    
}
