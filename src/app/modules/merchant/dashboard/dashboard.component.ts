import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { merge, of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from 'app/modules/merchant/dashboard/dashboard.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { DailyTopProducts, DailyTopProductsPagination, DetailedDailySales, DetailedDailySalesPagination, Settlement, SettlementPagination, SummarySales, SummarySalesPagination, TotalSalesDaily, TotalSalesMonthly, TotalSalesTotal, TotalSalesWeekly } from './dashboard.types';
import { items } from 'app/mock-api/apps/file-manager/data';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';

@Component({
    selector       : 'dashboard',
    templateUrl    : './dashboard.component.html',
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
    topProductChart:any;
    
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

    detailedDailySalesCol = ["date","customerName","subTotal","serviceCharge","deliveryCharge","commission","total"]
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

    settlementCol = ["payoutDate","startDate","cutoffDate","grossAmount","serviceCharges","deliveryCharges","commission","netAmount"]
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
    failedCompletionStatus = ["REQUESTING_DELIVERY_FAILED","PAYMENT_FAILED","CANCELED_BY_CUSTOMER","FAILED","REJECTED_BY_STORE"];

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

    dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    thisWeekStartDate : any;
    lastMonday: any;

    topProductThisWeekRow = [];
    topProductLastWeekRow = [];

    firstThisWeek: string;
    secondThisWeek: string;
    thirdThisWeek: string;

    firstLastWeek: string;
    secondLastWeek: string;
    thirdLastWeek: string;
    

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
                this.currencySymbol = store.regionCountry.currencySymbol;
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
                this.dailyTopProductsRow = [];
                dailyTopProducts.forEach(item=>{
                    this.dailyTopProductsRow.push({
                        date: item.date, 
                        productName: item.name, 
                        rank: 1, 
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
                        serviceCharge: 3, 
                        deliveryCharge: 2,
                        commission: 1,
                        total: item.total
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
                    this.settlementRow.push({ 
                        payoutDate: items.settlementDate,
                        startDate: items.cycleStartDate,
                        cutoffDate: items.cycleEndDate,
                        grossAmount: items.totalTransactionValue,
                        serviceCharges: items.totalServiceFee,
                        deliveryCharges: items.totalDeliveryFee,
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

        // Chart

        this.seriesChart  = {
            'this-week': [
                {
                    name: 'Completed',
                    type: 'line',
                    data: [42, 28, 43, 34, 20, 25, 22]
                },
                {
                    name: 'Pending',
                    type: 'line',
                    data: [1, 5, 13, 12, 15, 4, 9]
                },
                {
                    name: 'Failed',
                    type: 'column',
                    data: [11, 10, 8, 11, 8, 10, 17]
                }
            ],
            'last-week': [
                {
                    name: 'Completed',
                    type: 'line',
                    data: [37, 32, 39, 27, 18, 24, 20]
                },
                {
                    name: 'Pending',
                    type: 'line',
                    data: [9, 8, 10, 12, 7, 11, 15]
                },
                {
                    name: 'Failed',
                    type: 'column',
                    data: [11, 10, 8, 11, 8, 10, 17]
                }
            ]
        }

        

        

        this._prepareChartData();

        // Get the data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the data
                this.data = data;

                // Prepare the chart data
                // this._prepareChartData();
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.summarySalesDateRange.end = formattedDate;

                    return this._dashboardService.getSummarySales(this.storeId$, 0, 10, 'created', 'asc','', 
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.detailedDailySalesDateRange.end = formattedDate;

                    return this._dashboardService.getDetailedDailySales(this.storeId$, 0, 10, 'created', 'asc', 
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.dailyTopProductsDateRange.end = formattedDate;

                    return this._dashboardService.getDailyTopProducts(this.storeId$, 0, 10, 'date', 'asc', "",
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
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
                    const myDate = query;
                    const locale = 'en-MY';
                    const formattedDate = formatDate(myDate, format, locale);
                    
                    this.settlementDateRange.end = formattedDate;

                    return this._dashboardService.getSettlement(this.storeId$, 0, 10, 'created', 'cycleStartDate',
                                                                            this.settlementDateRange.start, this.settlementDateRange.end);
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Top Product This Week
        // -------------------------------

        console.log("Last Monday", this.getPreviousMonday());        
        this.thisWeekStartDate  = new Date();
        this.thisWeekStartDate.setDate(this.thisWeekStartDate.getDate()-7); 
        console.log("this.thisWeekDate", this.thisWeekStartDate);

        //Tue Dec 21 2021 21:21:16 GMT+0800 (Malaysia Time)

        var d = new Date(this.thisWeekStartDate);
        var dayName = this.dayNames[d.getDay()];
        console.log("dayName", dayName);
        
        // set to Monday of this week
        let lastMonday = this.getPreviousMonday()
        let today = new Date();
        let locale = 'en-MY';

        // reformat date 
        const format = 'yyyy-MM-dd';
        let formattedLastMonday = formatDate(lastMonday, format, locale);
        let formattedToday = formatDate(today, format, locale);

        this._dashboardService.getDailyTopProducts(this.storeId$, 0, 10, 'ranking', 'asc', "",
        formattedLastMonday, formattedToday)
        .subscribe(response => {
            
            this.topProductThisWeekRow = []

            if (response['data'].content.length >=3){
                for (let i = 0; i < 3 ; i++){
                    console.log(response['data'].content[i].name);
                    this.topProductThisWeekRow[i] = response['data'].content[i].name
                }
            }
            else {
                for (let i = 0; i < response['data'].content.length ; i++){
                    console.log(response['data'].content[i].name);
                    this.topProductThisWeekRow[i] = response['data'].content[i].name
                }
                this.topProductThisWeekRow[2] = ''
            }
            console.log("this.topProductThisWeekRow", this.topProductThisWeekRow[0]);

            this.firstThisWeek = this.topProductThisWeekRow[0];
            this.secondThisWeek = this.topProductThisWeekRow[1];
            this.thirdThisWeek = this.topProductThisWeekRow[2];

            // response['data'].content.forEach(a => {
            //     this.topProductThisWeekRow.push({
            //         name : a.name,
            //         ranking : a.ranking
            //     })
                
            // });
            
        })

        // -------------------------------
        // Top Product Last Week
        // -------------------------------

        // set to Monday of this week
        let lastWeekStart = this.getPreviousMonday()
        let lastWeekEnd = new Date();

        // lastWeekStart.setDate(lastWeekStart.getDate() - (lastWeekStart.getDay() + 6) % 7);

        // set to start of last week
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        // set to end of last week
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        console.log("Start of last week ", lastWeekStart);
        console.log("End of last week ", lastWeekEnd);
        
        
        
        // reformat date 
        let formattedLastWeekStart = formatDate(lastWeekStart, format, locale);
        let formattedLastWeekEnd = formatDate(lastWeekEnd, format, locale);

        this._dashboardService.getDailyTopProducts(this.storeId$, 0, 10, 'ranking', 'asc', "",
        formattedLastWeekStart, formattedLastWeekEnd)
        .subscribe(response => {
            
            this.topProductLastWeekRow = []

            if (response['data'].content.length >=3){
                for (let i = 0; i < 3 ; i++){
                    console.log(response['data'].content[i].name);
                    this.topProductLastWeekRow[i] = response['data'].content[i].name
                }
            }
            else {
                for (let i = 0; i < response['data'].content.length ; i++){
                    console.log(response['data'].content[i].name);
                    this.topProductLastWeekRow[i] = response['data'].content[i].name
                }
                this.topProductLastWeekRow[2] = ''
            }
            console.log("this.topProductLastWeekRow", this.topProductLastWeekRow[0]);

            this.firstLastWeek = this.topProductLastWeekRow[0];
            this.secondLastWeek = this.topProductLastWeekRow[1];
            this.thirdLastWeek = this.topProductLastWeekRow[2];

            // response['data'].content.forEach(a => {
            //     this.topProductThisWeekRow.push({
            //         name : a.name,
            //         ranking : a.ranking
            //     })
                
            // });
            
        })

        this.overviewChart = {
            'this-week':{
                            'completed'   : this.sumWeeklyCompleted,
                            'pending'     : this.sumWeeklyPending,
                            'failed'     : this.sumWeeklyFailed,
                        },
            'last-week':{
                            'completed'   : this.sumMonthlyCompleted,
                            'pending'     : this.sumMonthlyPending,
                            'failed'     : this.sumMonthlyFailed,
                        }
        },

        this.topProductChart = {
            'this-week':{
                            'rank_one'   : this.topProductThisWeekRow[0],
                            'rank_two'     : this.topProductThisWeekRow[1],
                            'rank_three'     : this.topProductThisWeekRow[2],
                        },
            'last-week':{
                            'rank_one'   : this.sumMonthlyCompleted,
                            'rank_two'     : this.sumMonthlyPending,
                            'rank_three'     : this.sumMonthlyFailed,
                        }
        },
        
        
                

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

                        if (this.detailedDailySalesDateRange.start == null && this.detailedDailySalesDateRange.end == null)
                            return this._dashboardService.getDetailedDailySales(this.storeId$, this._detailedDailySalesPaginator.pageIndex, this._detailedDailySalesPaginator.pageSize, "date", "asc");
                        else
                            return this._dashboardService.getDetailedDailySales(this.storeId$, this._detailedDailySalesPaginator.pageIndex, this._detailedDailySalesPaginator.pageSize, "date", "asc", 
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
            var date = new Date();
            var day = date.getDay();
            var prevMonday = new Date();
            if(date.getDay() == 0){
                prevMonday.setDate(date.getDate() - 7);
            }
            else{
                prevMonday.setDate(date.getDate() - (day-1));
            }
        
            return prevMonday;
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
                    }
                }
            },
            markers: {
                size: 0,
                hover: {
                  sizeOffset: 6
                }
              }
        };
    }
}
