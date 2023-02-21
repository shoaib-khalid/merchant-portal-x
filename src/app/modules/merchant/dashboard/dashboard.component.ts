import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { forkJoin, merge, of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import {
    ApexAxisChartSeries,
    ApexChart,
    ChartComponent,
    ApexDataLabels,
    ApexPlotOptions,
    ApexYAxis,
    ApexLegend,
    ApexStroke,
    ApexXAxis,
    ApexFill,
    ApexTooltip
  } from "ng-apexcharts";
import { DashboardService } from 'app/modules/merchant/dashboard/dashboard.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { DailyTopProducts, DailyTopProductsPagination, DetailedDailySales, DetailedDailySalesPagination, Settlement, SettlementPagination, StaffName, StaffSales, StaffSalesDetail, StaffSalesPagination, SummarySales, SummarySalesPagination, TotalSalesAmount, TotalSalesDaily, TotalSalesMonthly, TotalSalesTotal, TotalSalesWeekly, WeeklyGraph } from './dashboard.types';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import * as XLSX from 'xlsx';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { OrdersCountSummary } from '../orders-management/orders-list/orders-list.types';
import { OrdersListService } from '../orders-management/orders-list/orders-list.service';
import { InventoryService } from 'app/core/product/inventory.service';
import { MatTableDataSource } from '@angular/material/table';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    yaxis: ApexYAxis | ApexYAxis[];
    xaxis: ApexXAxis;
    fill: ApexFill;
    tooltip: ApexTooltip;
    stroke: ApexStroke;
    legend: ApexLegend;
    labels: string[];
  };

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
    @ViewChild("staffSalesPaginator", {read: MatPaginator}) private _staffSalesPaginator: MatPaginator;


    store: Store = null;
    stores: Store[];
    currentStoreId: string;
    storeName: string = "";
    // salesChart: ApexOptions = {};
    salesChart: Partial<ChartOptions>;
    data: any;
    seriesChart: any;
    overviewChart: any;
    weeklyGraph: boolean = true;

    orderCountSummary: OrdersCountSummary[];
    _orderCountSummary: any;
    orderSummary_serviceTypeControl: FormControl = new FormControl('');
    orderSummaryServiceType = ''

    outOfStockProducts: string;
    verticalCode: string = '';

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
    summarySalesServiceType = '';
    summarySales_serviceTypeControl: FormControl = new FormControl('');

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
    dailyTopProductsServiceType: string = '';

    // -------------------------------
    // Daily Detailed Sales Properties
    // -------------------------------

    detailedDailySalesCol = ["date", "customerName", "serviceType", "serveBy" , "total", "subTotal", "appliedDiscount","serviceCharge","deliveryCharge", "deliveryDiscount","commission","netTotal"]
    detailedDailySalesRow = [];
    detailedDailySalesPagination: DetailedDailySalesPagination;
    detailedDailySalesDateRange: any = {
        start : null,
        end: null
    }
    detailedDailySalesDateInputStart: FormControl = new FormControl();
    detailedDailySalesDateInputEnd: FormControl = new FormControl();
    detailedDailySales_serviceTypeControl: FormControl = new FormControl('');
    detailedDailySalesServiceType: string = '';

    // -------------------------------
    // Staff Sales Properties
    // -------------------------------

    staffSalesDataSource: MatTableDataSource<any> = new MatTableDataSource();
    staffSalesCol = ["date", "totalAmount", "cash", 'duitNow' , "others"]
    // staffSales: StaffSales[] = []
    staffFormControl: FormControl = new FormControl();
    staffNames: StaffName[] = [];
    staffId: string = '';

    thisMonthStaffSales: string = null;
    lastMonthStaffSales: string = null;
    thisMonthStaffSalesYear: number = null;
    lastMonthStaffSalesYear: number = null;

    staffSalesPagination: StaffSalesPagination = {
        length: 0,
        size: 0,
        page: 0,
        lastPage: 0,
        startIndex: 0,
        endIndex: 0
    };
    staffSalesDateRange: any = {
        start : null,
        end: null
    }
    staffSalesDateInputStart: FormControl = new FormControl();
    staffSalesDateInputEnd: FormControl = new FormControl();
    staffSales_serviceTypeControl: FormControl = new FormControl('');
    staffSalesServiceType: string = '';

    settlementPageSize: number = 10;


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

    // totalSalesTotalRow = [];
    // totalSalesDailyRow = [];
    // totalSalesWeeklyRow = [];
    // totalSalesMonthlyRow = [];
    
    totalSalesAmount: TotalSalesAmount

    // sumTotalCompleted: number = 0;
    // sumTotalPending: number = 0;
    // sumTotalFailed: number = 0;

    // sumDailyCompleted: number = 0;
    // sumDailyPending: number = 0;
    // sumDailyFailed: number = 0;

    // sumWeeklyCompleted: number = 0;
    // sumWeeklyPending: number = 0;
    // sumWeeklyFailed: number = 0;

    // sumMonthlyCompleted: number = 0;
    // sumMonthlyPending: number = 0;
    // sumMonthlyFailed: number = 0;

    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currencySymbol: string = '$';

    lastMonday: any;

    // topProductThisWeekRow = [];
    // topProductLastWeekRow = [];

    firstThisWeek: {
        amount: number,
        day: string
    };
    secondThisWeek: {
        amount: number,
        day: string
    };
    thirdThisWeek: {
        amount: number,
        day: string
    };

    firstLastWeek: {
        amount: number,
        day: string
    };
    secondLastWeek: {
        amount: number,
        day: string
    };
    thirdLastWeek: {
        amount: number,
        day: string
    };

    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    graphServiceType = ''
    salesOverview_serviceTypeControl: FormControl = new FormControl('');

    sumThisWeekCompleted: number = 0;
    sumThisWeekPending: number = 0;
    sumThisWeekFailed: number = 0;

    sumLastWeekCompleted: number = 0;
    sumLastWeekPending: number = 0;
    sumLastWeekFailed: number = 0;

    thisWeekChartArr = [];
    lastWeekChartArr = [];

    thisWeekDayChartCompleted = [0,0,0,0,0,0,0];
    // thisWeekDayChartPending = [0,0,0,0,0,0,0];
    // thisWeekDayChartFailed = [0,0,0,0,0,0,0];
    thisWeekDayChartAmount = [0,0,0,0,0,0,0];

    lastWeekDayChartCompleted = [0,0,0,0,0,0,0];
    // lastWeekDayChartPending = [0,0,0,0,0,0,0];
    // lastWeekDayChartFailed = [0,0,0,0,0,0,0];
    lastWeekDayChartAmount = [0,0,0,0,0,0,0];

    summarySalesFileExel= 'SummarySales.xlsx';
    dailySalesFileExel= 'DailySales.xlsx';
    dailyTopProductFileExel= 'DailyTopProduct.xlsx';
    settlementFileExel= 'Settlement.xlsx';
    staffSalesReportFileExel= 'StaffSalesReport.xlsx';

    summarySalesPageSize: number = 10;
    detailedDailySalesPageSize: number = 10;
    dailyTopProductsPageSize: number = 10;
    staffSalesPageSize: number = 10;

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
        private _orderslistService: OrdersListService,
        private _inventoryService: InventoryService,
    )
    {
        const now = new Date();
        const todayDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();

        now.setDate(now.getDate()-7);
        const fromDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();

        this.detailedDailySalesDateRange.start = fromDate;
        this.detailedDailySalesDateRange.end = todayDate;

        this.summarySalesDateRange.start = fromDate;
        this.summarySalesDateRange.end = todayDate;

        this.dailyTopProductsDateRange.start = fromDate;
        this.dailyTopProductsDateRange.end = todayDate;

        this.settlementDateRange.staff = fromDate;
        this.settlementDateRange.end = todayDate;

        this.staffSalesDateRange.start = fromDate;
        this.staffSalesDateRange.end = todayDate;

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

        this._inventoryService.getProducts(0,100,'name','asc','','OUTOFSTOCK','')
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response) => {

            this.outOfStockProducts = response['data'].totalElements;

        });

        this._orderslistService.ordersCountSummary$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response) => {

            this.orderCountSummary = response;

            this._orderCountSummary = [
                { id: "NEW", label: "New", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE"], count: 0 },
                { id: "PROCESS", label: "Process", completionStatus: "BEING_PREPARED", count: 0 },
                { id: "AWAITING_PICKUP", label: "Awaiting Pickup", completionStatus: "AWAITING_PICKUP", count: 0 },
                { id: "SENT_OUT", label: "Sent Out", completionStatus: "BEING_DELIVERED", count: 0 },
                { id: "DELIVERED", label: "Delivered", completionStatus: "DELIVERED_TO_CUSTOMER", count: 0 },
                { id: "CANCELLED", label: "Cancelled", completionStatus: "CANCELED_BY_MERCHANT", count: 0 },
                { id: "HISTORY", label: "History", completionStatus: ["PAYMENT_CONFIRMED", "RECEIVED_AT_STORE", "BEING_PREPARED", "AWAITING_PICKUP", "BEING_DELIVERED", "DELIVERED_TO_CUSTOMER", "CANCELED_BY_MERCHANT"], count: 0 }
            ];

            this._orderCountSummary.forEach((item,i) => {

                // if have multiple completionStatus
                if (Array.isArray(item.completionStatus) && item.completionStatus.length > 1) {
                    item.completionStatus.forEach((element, j) => {
                        let index = this.orderCountSummary.findIndex((obj => obj.completionStatus === item.completionStatus[j]));
                        if (index > -1) {
                            this._orderCountSummary[i].count = this._orderCountSummary[i].count + this.orderCountSummary[index].count;
                        }
                    });
                } else {
                    let index = this.orderCountSummary.findIndex((obj => obj.completionStatus === item.completionStatus));
                    if (index > -1) {
                        this._orderCountSummary[i].count = this.orderCountSummary[index].count;
                    }
                }
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

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
                    this.verticalCode = store.verticalCode;
                    this.store = store;
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
                        deliveryType: item.deliveryType,
                        serviceType: item.serviceType
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

        // Get Total Sales Amount
        this._dashboardService.totalSalesAmount$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((totalSalesAmount: TotalSalesAmount)=>{

            this.totalSalesAmount = totalSalesAmount;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

        /*
        // Get the Total Sales Total
        this._dashboardService.totalSalesTotal$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesTotal: TotalSalesTotal[])=>{
                this.totalSalesTotalRow = [];
                this.sumTotalCompleted = 0;
                this.sumTotalPending = 0;
                this.sumTotalFailed = 0;

                totalSalesTotal.forEach(items => {
                    this.totalSalesTotalRow.push({
                        completionStatus: items.completionStatus,
                        total: items.total,
                    });

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

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Total Sales Daily
        this._dashboardService.totalSalesDaily$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesDaily: TotalSalesDaily[])=>{
                this.totalSalesDailyRow = [];
                this.sumDailyCompleted = 0;
                this.sumDailyPending = 0;
                this.sumDailyFailed = 0;

                totalSalesDaily.forEach(items => {
                    this.totalSalesDailyRow.push({
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });
                // Sum up Total Sales Daily
                this.totalSalesDailyRow.forEach(a => {

                    if (this.completeCompletionStatus.includes(a.completionStatus))
                        this.sumDailyCompleted += a.total;

                    else if (this.failedCompletionStatus.includes(a.completionStatus))
                        this.sumDailyFailed += a.total;

                    else
                        this.sumDailyPending += a.total;

                })

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Total Sales Weekly
        this._dashboardService.totalSalesWeekly$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesWeekly: TotalSalesWeekly[])=>{
                this.totalSalesWeeklyRow = [];
                this.sumWeeklyCompleted = 0;
                this.sumWeeklyPending = 0;
                this.sumWeeklyFailed = 0;

                totalSalesWeekly.forEach(items => {
                    this.totalSalesWeeklyRow.push({
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });

                // Sum up Total Sales Weekly
                this.totalSalesWeeklyRow.forEach(a => {

                    if (this.completeCompletionStatus.includes(a.completionStatus))
                        this.sumWeeklyCompleted += a.total;

                    else if (this.failedCompletionStatus.includes(a.completionStatus))
                        this.sumWeeklyFailed += a.total;

                    else
                        this.sumWeeklyPending += a.total;

                })

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Total Sales Monthly
        this._dashboardService.totalSalesMonthly$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((totalSalesMonthly: TotalSalesMonthly[])=>{
                this.totalSalesMonthlyRow = [];
                this.sumMonthlyCompleted = 0;
                this.sumMonthlyPending = 0;
                this.sumMonthlyFailed = 0;

                totalSalesMonthly.forEach(items => {
                    this.totalSalesMonthlyRow.push({
                        completionStatus: items.completionStatus,
                        total: items.total
                    });
                });

                    // Sum up Total Sales Monthly
                this.totalSalesMonthlyRow.forEach(a => {

                    if (this.completeCompletionStatus.includes(a.completionStatus))
                        this.sumMonthlyCompleted += a.total;

                    else if (this.failedCompletionStatus.includes(a.completionStatus))
                        this.sumMonthlyFailed += a.total;

                    else
                        this.sumMonthlyPending += a.total;

                })

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        */

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

        // Get staff names
        this._dashboardService.staffNames$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((staffNames: StaffName[]) => {
                this.staffNames = staffNames;
            })
        
        // Get the Staff Sales Report
        this._dashboardService.staffSalesDetails$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((staffSales: StaffSalesDetail[]) => {
                if (staffSales) {

                    this.staffSalesDataSource.data = staffSales.map(sale => {

                        let paymentType = {};
                        let cashAmount = 0;
                        let duitNowAmount = 0;
                        let othersAmount = 0;

                        // Get sales amount for each channel
                        sale.summaryDetails.forEach(sale => {

                            if ( sale.paymentChannel == 'CASH' ) {
                                cashAmount = sale.saleAmount;
                            }
                            if ( sale.paymentChannel == 'DUITNOW' ) {
                                duitNowAmount = sale.saleAmount;
                            }
                            if ( sale.paymentChannel != 'CASH' && sale.paymentChannel != 'DUITNOW' ) {
                                othersAmount = othersAmount + sale.saleAmount;
                            }

                            paymentType = { cashAmount, duitNowAmount, othersAmount };
                        })

                        return { ...sale, paymentType: paymentType }
                    })                    

                    // if(staffSales[0]){
                    //     this.thisMonthStaffSales = staffSales[0].monthlyCount.month
                    //     this.lastMonthStaffSales = staffSales[0].previousMonthlyCount.month

                    //     this.thisMonthStaffSalesYear = parseInt(staffSales[0].dailyCount.date.substring(0, 4))
                    //     if(staffSales[0].monthlyCount.month === 'January'){
                    //         this.lastMonthStaffSalesYear = (parseInt(staffSales[0].dailyCount.date.substring(0, 4)) - 1)
                    //     }else{
                    //         this.lastMonthStaffSalesYear = parseInt(staffSales[0].dailyCount.date.substring(0, 4))
                    //     }
                    // }

                    // // Remove the table if no month of sales
                    // if (this.thisMonthStaffSales === null) {
                    //     this.staffSalesCol.splice(this.staffSalesCol.indexOf("thisMonth"), 1);
                    // }

                    // if (this.lastMonthStaffSales === null) {
                    //     this.staffSalesCol.splice(this.staffSalesCol.indexOf("lastMonth"), 1);
                    // }
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Staff Sales Pagination
        this._dashboardService.staffSalesPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: StaffSalesPagination) => {
                if (pagination) {
                    // Update the pagination
                    this.staffSalesPagination = pagination;
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Mark for check
        this._changeDetectorRef.markForCheck();

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

                    return this._dashboardService.getSummarySales(this.storeId$, {
                        page: 0,
                        pageSize: this.summarySalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        from: this.summarySalesDateRange.start,
                        to: this.summarySalesDateRange.end,
                        serviceType: this.summarySalesServiceType,
                        search: ''
                    });
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // Filter by service type dropdown
        this.summarySales_serviceTypeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((value) => {

                    this.isLoading = true;
                    return this._dashboardService.getSummarySales(this.storeId$, {
                        page: 0,
                        pageSize: this.summarySalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        from: this.summarySalesDateRange.start,
                        to: this.summarySalesDateRange.end,
                        serviceType: value,
                        search: ''
                    });
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Daily Detailed Sales Date Range Input
        // -------------------------------

        // Filter by service type dropdown
        this.detailedDailySales_serviceTypeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((value) => {
                    if(value === 'DINEIN' || value === "")
                    {
                        let index = this.detailedDailySalesCol.indexOf("serveBy");
                        if(index < 0){
                            this.detailedDailySalesCol.splice(3, 0, "serveBy");
                        }
                    }
                    else{
                        let index = this.detailedDailySalesCol.indexOf("serveBy");
                        if(index >= 0){
                            this.detailedDailySalesCol.splice(index, 1);
                        }
                    }


                    this.isLoading = true;
                    return this._dashboardService.getDetailedDailySales(this.storeId$, {
                        page: 0,
                        pageSize: this.detailedDailySalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        startDate: this.detailedDailySalesDateRange.start,
                        endDate: this.detailedDailySalesDateRange.end,
                        serviceType: value
                    });
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

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

                    return this._dashboardService.getDetailedDailySales(this.storeId$, {
                        page: 0,
                        pageSize: this.detailedDailySalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        startDate: this.detailedDailySalesDateRange.start,
                        endDate: this.detailedDailySalesDateRange.end,
                        serviceType: this.detailedDailySalesServiceType
                    });

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

                    return this._dashboardService.getDailyTopProducts(
                        this.storeId$, 'current',
                        {
                            page: 0,
                            pageSize: this.dailyTopProductsPageSize,
                            sortBy: 'date',
                            sortingOrder: 'ASC',
                            search: '',
                            startDate: this.dailyTopProductsDateRange.start,
                            endDate: this.dailyTopProductsDateRange.end,
                            serviceType: ''

                        });
                }),
                map(() => {

                    this.isLoading = false;
                })
            )
            .subscribe();

        // -------------------------------
        // Staff Sales Report Date Range Input and Staff Filter
        // -------------------------------

        this.staffFormControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;

                    // // reformat date
                    // const format = 'yyyy-MM-dd';
                    // let myDate = query;
                    // const locale = 'en-MY';
                    // let formattedDate = formatDate(myDate, format, locale);

                    // this.staffSalesDateRange.start = formattedDate;

                    this.staffId = query;

                    return this._dashboardService.getStaffTotalSalesByStaffId(this.storeId$, {
                        page: 0,
                        pageSize: this.staffSalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        from: this.staffSalesDateRange.start,
                        to: this.staffSalesDateRange.end,
                    }, this.staffId);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to start date input field value changes
        this.staffSalesDateInputStart.valueChanges
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

                    this.staffSalesDateRange.start = formattedDate;

                    // do nothing
                    return of(true);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Subscribe to end date input field value changes
        this.staffSalesDateInputEnd.valueChanges
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

                    this.staffSalesDateRange.end = formattedDate;

                    return this._dashboardService.getStaffTotalSalesByStaffId(this.storeId$, {
                        page: 0,
                        pageSize: this.staffSalesPageSize,
                        sortBy: 'created',
                        sortingOrder: 'ASC',
                        from: this.staffSalesDateRange.start,
                        to: this.staffSalesDateRange.end,
                    }, this.staffId );
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

                    return this._dashboardService.getSettlement(
                        this.storeId$,
                        0,
                        this.settlementPageSize,
                        'created',
                        'cycleStartDate',
                        this.settlementDateRange.start,
                        this.settlementDateRange.end);
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

        // this._dashboardService.dailyTopProductsThisWeek$
        // .pipe(takeUntil(this._unsubscribeAll))
        // .subscribe(response => {

        //     this.topProductThisWeekRow = []

        //     this.topProductThisWeekRow = response.map(product => {
        //         return {
        //             name : product.name,
        //             rank : product.ranking
        //         }
        //     })

        //     // sort the array by rank
        //     this.topProductThisWeekRow.sort(function (x, y) {
        //         return x.rank - y.rank;
        //     });

        //     // assign product name to the top three
        //     this.firstThisWeek = this.topProductThisWeekRow[0]?.name;
        //     this.secondThisWeek = this.topProductThisWeekRow[1]?.name;
        //     this.thirdThisWeek = this.topProductThisWeekRow[2]?.name;

        //     // Mark for check
        //     this._changeDetectorRef.markForCheck();

        // })

        // // -------------------------------
        // // Graph & Overview This Week
        // // -------------------------------

        this._dashboardService.weeklySalesGraphThisWeek$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response: WeeklyGraph[]) => {
                this.thisWeekDayChartAmount = [0,0,0,0,0,0,0];

                response.forEach(resp => {

                    const day = new Date(resp.date).getDay();

                    this.thisWeekDayChartAmount[day] += resp.totalSalesAmount;

                })

                // Create a copy of the array using the slice() method and sort it in descending order using the sort() method
                const sortedArr = this.thisWeekDayChartAmount.slice().sort((a, b) => b - a);

                // Get the index positions of each element in the original array
                const indexArr = sortedArr.map(el => this.thisWeekDayChartAmount.indexOf(el));   
                
                // assign to the top three
                this.firstThisWeek = { amount: sortedArr[0], day: sortedArr[0] ? this.days[indexArr[0]] : ''};
                this.secondThisWeek = { amount: sortedArr[1], day: sortedArr[1] ? this.days[indexArr[1]] : ''};
                this.thirdThisWeek = { amount: sortedArr[2], day: sortedArr[2] ? this.days[indexArr[2]] : ''};

                this._prepareChartData();

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        this._dashboardService.weeklyGraphThisWeek$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response: WeeklyGraph[]) => {

            this.sumThisWeekCompleted = 0;
            this.sumThisWeekPending = 0;
            this.sumThisWeekFailed = 0;
            this.thisWeekDayChartCompleted = [0,0,0,0,0,0,0];

            response.forEach(resp => {
                if (this.completeCompletionStatus.includes(resp.completionStatus)) {
                    this.sumThisWeekCompleted += resp.total;
                    this.thisWeekDayChartCompleted[new Date(resp.date).getDay()] += resp.total;
                }
                else if (this.failedCompletionStatus.includes(resp.completionStatus)){
                    this.sumThisWeekFailed += resp.total;
                }
                else {
                    this.sumThisWeekPending += resp.total;
                }
            })

            this._prepareChartData();

            // Mark for check
            this._changeDetectorRef.markForCheck();
        })

        //-----------------------------
        // Get dates for last week
        //-----------------------------

        // get this week monday
        let lastWeekStart = this.getPreviousMonday();

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

        // this._dashboardService.dailyTopProductsLastWeek$
        // .pipe(takeUntil(this._unsubscribeAll))
        // .subscribe(response => {

        //     this.topProductLastWeekRow = []

        //     this.topProductLastWeekRow = response.map(product => {
        //         return {
        //             name : product.name,
        //             rank : product.ranking
        //         }
        //     })

        //     // sort the array by rank
        //     this.topProductLastWeekRow.sort(function (x, y) {
        //         return x.rank - y.rank;
        //     });

        //     // assign product name to the top three
        //     this.firstLastWeek = this.topProductLastWeekRow[0]?.name;
        //     this.secondLastWeek = this.topProductLastWeekRow[1]?.name;
        //     this.thirdLastWeek = this.topProductLastWeekRow[2]?.name;

        //     // Mark for check
        //     this._changeDetectorRef.markForCheck();

        // })

        // // -------------------------------
        // // Graph & Overview Last Week
        // // -------------------------------

        this._dashboardService.weeklySalesGraphLastWeek$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response: WeeklyGraph[]) => {
                this.lastWeekDayChartAmount = [0,0,0,0,0,0,0];

                response.forEach(resp => {

                    const day = new Date(resp.date).getDay();

                    this.lastWeekDayChartAmount[day] += resp.totalSalesAmount;

                })

                // Create a copy of the array using the slice() method and sort it in descending order using the sort() method
                const sortedArr = this.lastWeekDayChartAmount.slice().sort((a, b) => b - a);

                // Get the index positions of each element in the original array
                const indexArr = sortedArr.map(el => this.lastWeekDayChartAmount.indexOf(el));                   
                
                // assign to the top three
                this.firstLastWeek = { amount: sortedArr[0], day: sortedArr[0] ? this.days[indexArr[0]] : ''};
                this.secondLastWeek = { amount: sortedArr[1], day: sortedArr[1] ? this.days[indexArr[1]] : ''};
                this.thirdLastWeek = { amount: sortedArr[2], day: sortedArr[2] ? this.days[indexArr[2]] : ''};

                this._prepareChartData();

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        this._dashboardService.weeklyGraphLastWeek$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response: WeeklyGraph[]) => {

            this.sumLastWeekCompleted = 0;
            this.sumLastWeekPending = 0;
            this.sumLastWeekFailed = 0;
            this.lastWeekDayChartCompleted = [0,0,0,0,0,0,0];

            response.forEach(resp => {
                if (this.completeCompletionStatus.includes(resp.completionStatus)) {
                    this.sumLastWeekCompleted += resp.total;
                    this.lastWeekDayChartCompleted[new Date(resp.date).getDay()] += resp.total;
                }
                else if (this.failedCompletionStatus.includes(resp.completionStatus)){
                    this.sumLastWeekFailed += resp.total;
                }
                else {
                    this.sumLastWeekPending += resp.total;
                }
            })

            this._prepareChartData();

            // Mark for check
            this._changeDetectorRef.markForCheck();

        })

        // Filter by service type dropdown
        this.salesOverview_serviceTypeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((value) => {

                    this.isLoading = true;

                    return forkJoin([
                        this._dashboardService.getWeeklySalesGraph(this.storeId$, 'this-week',
                            {
                                to: formattedToday,
                                from: formattedLastMonday,
                                serviceType: value
                            }),
                        this._dashboardService.getWeeklySalesGraph(this.storeId$, 'last-week',
                            {
                                to: formattedLastWeekEnd,
                                from: formattedLastWeekStart,
                                serviceType: value
                            }),
                        this._dashboardService.getWeeklyGraph(this.storeId$, 'this-week',
                            {
                                to: formattedToday,
                                from: formattedLastMonday,
                                serviceType: value
                            }),
                        this._dashboardService.getWeeklyGraph(this.storeId$, 'last-week',
                            {
                                to: formattedLastWeekEnd,
                                from: formattedLastWeekStart,
                                serviceType: value
                            }),
                        this._dashboardService.getTotalSalesAmount(this.storeId$, value),
                        // this._dashboardService.getDailyTopProducts(
                        //     this.storeId$, 'this-week',
                        //     {
                        //         page: 0,
                        //         pageSize: 10,
                        //         sortBy: 'date',
                        //         sortingOrder: 'DESC',
                        //         search: '',
                        //         startDate: formattedLastMonday,
                        //         endDate: formattedToday,
                        //         serviceType: value
                        //     }),
                        // this._dashboardService.getDailyTopProducts(
                        //     this.storeId$, 'last-week',
                        //     {
                        //         page: 0,
                        //         pageSize: 10,
                        //         sortBy: 'date',
                        //         sortingOrder: 'DESC',
                        //         search: '',
                        //         startDate: formattedLastWeekStart,
                        //         endDate: formattedLastWeekEnd,
                        //         serviceType: value
                        //     })
                        ])
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        // Filter by service type dropdown
        this.orderSummary_serviceTypeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((value) => {

                    this.isLoading = true;

                    return this._orderslistService.getOrdersCountSummary(value)
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();


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

                        return this._dashboardService.getDailyTopProducts(
                            this.storeId$, 'current',
                            {
                                page: this._dailyTopProductsPaginator.pageIndex,
                                pageSize: this._dailyTopProductsPaginator.pageSize,
                                sortBy: 'date',
                                sortingOrder: 'DESC',
                                search: '',
                                startDate: this.dailyTopProductsDateRange.start,
                                endDate: this.dailyTopProductsDateRange.end,
                                serviceType: ''
                            });

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

                        return this._dashboardService.getDetailedDailySales(this.storeId$, {
                            page: this._detailedDailySalesPaginator.pageIndex,
                            pageSize: this._detailedDailySalesPaginator.pageSize,
                            sortBy: 'created',
                            sortingOrder: 'ASC',
                            startDate: this.detailedDailySalesDateRange.start,
                            endDate: this.detailedDailySalesDateRange.end,
                            serviceType: this.detailedDailySalesServiceType
                        });
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

                        return this._dashboardService.getSummarySales(this.storeId$, {
                            page: this._summarySalesPaginator.pageIndex,
                            pageSize: this._summarySalesPaginator.pageSize,
                            sortBy: 'created',
                            sortingOrder: 'ASC',
                            from: this.summarySalesDateRange.start,
                            to: this.summarySalesDateRange.end,
                            serviceType: this.summarySalesServiceType,
                            search: ''
                        });
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
            if ( this._staffSalesPaginator )
            {

                // Mark for check
                this._changeDetectorRef.markForCheck();


                // Get customers if sort or page changes
                merge(this._staffSalesPaginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;

                        this.staffSalesPageSize = this._staffSalesPaginator.pageSize;

                        if (this.staffSalesDateRange.start == null && this.staffSalesDateRange.end == null)
                            return this._dashboardService.getStaffTotalSalesByStaffId(this.storeId$, {
                                page: this._staffSalesPaginator.pageIndex,
                                pageSize: this._staffSalesPaginator.pageSize,
                                sortBy: "created",
                                sortingOrder: "ASC"
                            }, this.staffId);
                        else
                            return this._dashboardService.getStaffTotalSalesByStaffId(this.storeId$,
                                {
                                    page: this._staffSalesPaginator.pageIndex,
                                    pageSize: this._staffSalesPaginator.pageSize,
                                    sortBy: "created",
                                    sortingOrder: "ASC",
                                    from: this.staffSalesDateRange.start,
                                    to: this.staffSalesDateRange.end
                                }, this.staffId);

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
                    name: 'Sales Amount',
                    type: 'column',
                    data: [this.thisWeekDayChartAmount[1], this.thisWeekDayChartAmount[2], this.thisWeekDayChartAmount[3],
                    this.thisWeekDayChartAmount[4], this.thisWeekDayChartAmount[5], this.thisWeekDayChartAmount[6], this.thisWeekDayChartAmount[0]]
                },
                {
                    name: 'Completed Order',
                    type: 'line',
                    data: [this.thisWeekDayChartCompleted[1], this.thisWeekDayChartCompleted[2], this.thisWeekDayChartCompleted[3],
                    this.thisWeekDayChartCompleted[4], this.thisWeekDayChartCompleted[5], this.thisWeekDayChartCompleted[6], this.thisWeekDayChartCompleted[0]]
                },
                // {
                //     name: 'Failed',
                //     type: 'column',
                //     data: [this.thisWeekDayChartFailed[1], this.thisWeekDayChartFailed[2], this.thisWeekDayChartFailed[3],
                //     this.thisWeekDayChartFailed[4], this.thisWeekDayChartFailed[5], this.thisWeekDayChartFailed[6], this.thisWeekDayChartFailed[0]]
                // }
            ],
            'last-week': [
                {
                    name: 'Sales Amount',
                    type: 'column',
                    data: [this.lastWeekDayChartAmount[1], this.lastWeekDayChartAmount[2], this.lastWeekDayChartAmount[3],
                    this.lastWeekDayChartAmount[4], this.lastWeekDayChartAmount[5], this.lastWeekDayChartAmount[6], this.lastWeekDayChartAmount[0]],


                },
                {
                    name: 'Completed Order',
                    type: 'line',
                    data: [this.lastWeekDayChartCompleted[1], this.lastWeekDayChartCompleted[2], this.lastWeekDayChartCompleted[3],
                    this.lastWeekDayChartCompleted[4], this.lastWeekDayChartCompleted[5], this.lastWeekDayChartCompleted[6], this.lastWeekDayChartCompleted[0]]
                },
                // {
                //     name: 'Failed',
                //     type: 'column',
                //     data: [this.lastWeekDayChartFailed[1], this.lastWeekDayChartFailed[2], this.lastWeekDayChartFailed[3],
                //     this.lastWeekDayChartFailed[4], this.lastWeekDayChartFailed[5], this.lastWeekDayChartFailed[6], this.lastWeekDayChartFailed[0]]
                // }
            ]
        }

        // Sales summary
        // this.salesChart = {
        //     chart      : {
        //         fontFamily: 'inherit',
        //         foreColor : 'inherit',
        //         height    : '100%',
        //         type      : 'line',
        //         toolbar   : {
        //             show: false
        //         },
        //         zoom      : {
        //             enabled: false
        //         },
        //     },
        //     colors     : ['#3b82f6', '#f59e0b', '#ef4444'],
        //     dataLabels : {
        //         enabled        : true,
        //         enabledOnSeries: [0, 1],
        //         background     : {
        //             borderWidth: 0
        //         }
        //     },
        //     grid       : {
        //         borderColor: 'var(--fuse-border)'
        //     },
        //     labels     : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        //     legend     : {
        //         show: false
        //     },
        //     plotOptions: {
        //         bar: {
        //             columnWidth: '50%'
        //         }
        //     },
        //     series     : this.seriesChart,
        //     states     : {
        //         hover: {
        //             filter: {
        //                 type : 'darken',
        //                 value: 0.75
        //             }
        //         }
        //     },
        //     stroke     : {
        //         width: [2, 2, 0]
        //     },
        //     tooltip    : {
        //         y: [
        //           {
        //             title: {
        //               formatter: function(val) {
        //                 return val;
        //               }
        //             }
        //           },
        //           {
        //             title: {
        //               formatter: function(val) {
        //                 return val;
        //               }
        //             }
        //           },
        //           {
        //             title: {
        //               formatter: function(val) {
        //                 return val;
        //               }
        //             }
        //           }
        //         ]
        //       },
        //     xaxis      : {
        //         axisBorder: {
        //             show: false
        //         },
        //         axisTicks : {
        //             color: 'var(--fuse-border)'
        //         },
        //         labels    : {
        //             style: {
        //                 colors: 'var(--fuse-text-secondary)'
        //             }
        //         },
        //         tooltip   : {
        //             enabled: false
        //         }
        //     },
        //     yaxis      : {
        //         labels: {
        //             offsetX: -16,
        //             style  : {
        //                 colors: 'var(--fuse-text-secondary)'
        //             },
        //             formatter: function(val) {
        //                 return val.toFixed(0)
        //             },
        //         },
        //         tickAmount: 1,
        //         title: {
        //             text: `${this.currencySymbol}`
        //           }
        //     },
        //     markers: {
        //         size: 0,
        //         hover: {
        //           sizeOffset: 6
        //         }
        //       }
        // };

        const currency = this.store ? this.store.regionCountry.currencySymbol : '$';

        this.salesChart = {
            chart: {
              height: 380,
              type: 'line',
              stacked: false,
            },
            stroke: {
              width: [0, 3, 5],
              curve: 'straight'
            },
            plotOptions: {
              bar: {
                columnWidth: '50%'
              }
            },
            series: this.seriesChart,
            fill: {
                opacity: [0.85, 0.85],
                // gradient: {
                //     inverseColors: false,
                //     shade: 'light',
                //     type: "vertical",
                //     opacityFrom: 0.85,
                //     opacityTo: 0.55,
                //     stops: [0, 100, 100, 100]
                // }
            },
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            xaxis: {
                labels: {
                    style: {
                        colors: 'var(--fuse-text-secondary)'
                    }
                },
            },
            yaxis: [
                {
                    labels: {
                        formatter: function (y) {
                            if (typeof y !== "undefined") {
                              return y.toFixed(2);
                            }
                            return y;
                            
                          }
                    },
                    title: {
                        style: {
                            color: undefined,
                            fontSize: '12px',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            cssClass: 'font-semibold',
                        },
                        text: `Sales Amount (${currency})`,
                    }
                },
                {
                    opposite: true,
                    labels: {
                        formatter: function (y) {
                            if (typeof y !== "undefined") {
                              return  y.toFixed(0);
                            }
                            return y;
                        }
                    },
                    title: {
                        style: {
                            color: undefined,
                            fontSize: '12px',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            cssClass: 'font-semibold',
                        },
                        text: 'Completed Order',
                    }
                }
            ],
            tooltip: {
              shared: true,
              intersect: false,
              y: [{
                formatter: function (y) {
                  if (typeof y !== "undefined") {
                    return  currency + y.toFixed(2);
                  }
                  return y;
                  
                }
              }, {
                formatter: function (y) {
                  if (typeof y !== "undefined") {
                    return  y.toFixed(0);
                  }
                  return y;
                }
              }]
            }
      
          }

        // Mark for check
        this._changeDetectorRef.markForCheck();
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

    exportstaffSalesToExcel(): void
    {
        /* pass here the table id */
        let element = document.getElementById('staffSales-table');
        const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        /* save to file */
        XLSX.writeFile(wb, this.staffSalesReportFileExel);
    }

}
