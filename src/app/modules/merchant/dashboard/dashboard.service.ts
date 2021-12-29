import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { DailyTopProducts, DailyTopProductsPagination, 
         DetailedDailySales, DetailedDailySalesPagination, 
         Settlement, 
         SettlementPagination, 
         SummarySales, SummarySalesPagination, TotalSalesDaily, TotalSalesMonthly, TotalSalesTotal, TotalSalesWeekly, WeeklySale 
       } from './dashboard.types';

@Injectable({
    providedIn: 'root'
})
export class DashboardService
{
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _dailyTopProduct: BehaviorSubject<DailyTopProducts | null> = new BehaviorSubject(null);
    private _dailyTopProducts: BehaviorSubject<DailyTopProducts[] | null> = new BehaviorSubject(null);
    private _dailyTopProductsPagination: BehaviorSubject<DailyTopProductsPagination | null> = new BehaviorSubject(null);

    private _detailedDailySale: BehaviorSubject<DetailedDailySales | null> = new BehaviorSubject(null);
    private _detailedDailySales: BehaviorSubject<DetailedDailySales[] | null> = new BehaviorSubject(null);
    private _detailedDailySalesPagination: BehaviorSubject<DetailedDailySalesPagination | null> = new BehaviorSubject(null);

    private _summarySale: BehaviorSubject<SummarySales | null> = new BehaviorSubject(null);
    private _summarySales: BehaviorSubject<SummarySales[] | null> = new BehaviorSubject(null);
    private _summarySalesPagination: BehaviorSubject<SummarySalesPagination | null> = new BehaviorSubject(null);

    private _currentDailyTopProducts: DailyTopProducts[] = [];

    private _totalSalesTotal: BehaviorSubject<TotalSalesTotal[] | null> = new BehaviorSubject(null);
    private _totalSalesDaily: BehaviorSubject<TotalSalesDaily[] | null> = new BehaviorSubject(null);
    private _totalSalesWeekly: BehaviorSubject<TotalSalesWeekly[] | null> = new BehaviorSubject(null);
    private _totalSalesMonthly: BehaviorSubject<TotalSalesMonthly[] | null> = new BehaviorSubject(null);

    private _settlement: BehaviorSubject<Settlement[] | null> = new BehaviorSubject(null);
    private _settlementPagination: BehaviorSubject<SettlementPagination | null> = new BehaviorSubject(null);

    private _weeklySale: BehaviorSubject<WeeklySale[] | null> = new BehaviorSubject(null);

    fromDate: string;
    todayDate: string;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
        private _logging: LogService
    )
    {
        const now = new Date();
        this.todayDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
    
        now.setDate(now.getDate()-7);
        this.fromDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any>
    {
        return this._data.asObservable();
    }

    /**
     * Getter for dailyTopProducts
     *
    */
    get dailyTopProducts$(): Observable<DailyTopProducts[]>
    {
        return this._dailyTopProducts.asObservable();
    }

    /**
      * Getter for pagination dailyTopProducts
      */
    get dailyTopProductsPagination$(): Observable<DailyTopProductsPagination>
    {
        return this._dailyTopProductsPagination.asObservable();
    }

    /**
     * Getter for detailedDailySales
     *
    */
    get detailedDailySales$(): Observable<DetailedDailySales[]>
    {
        return this._detailedDailySales.asObservable();
    }
    
    /**
     * Getter for pagination
     */
    get detailedDailySalesPagination$(): Observable<DetailedDailySalesPagination>
    {
        return this._detailedDailySalesPagination.asObservable();
    }

    /**
     * Setter for detailedDailySales
     *
     * @param value
     */
    set detailedDailySales(value: DetailedDailySales[])
    {
        // Store the value
        this._detailedDailySales.next(value);
    }

    /**
     * Getter for summarySales
     *
    */
    get summarySales$(): Observable<SummarySales[]>
    {
        return this._summarySales.asObservable();
    }

    /**
     * Setter for summarySales
     *
     * @param value
     */
    set summarySales(value: SummarySales[])
    {
        // Store the value
        this._summarySales.next(value);
    }

    /**
      * Getter for pagination
      */
     get summarySalesPagination$(): Observable<SummarySalesPagination>
     {
         return this._summarySalesPagination.asObservable();
     }

    /**
     * Getter for totalSales
     *
    */
     get totalSalesTotal$(): Observable<TotalSalesTotal[]>
     {
         return this._totalSalesTotal.asObservable();
     }
     get totalSalesDaily$(): Observable<TotalSalesDaily[]>
     {
         return this._totalSalesDaily.asObservable();
     }
     get totalSalesWeekly$(): Observable<TotalSalesWeekly[]>
     {
         return this._totalSalesWeekly.asObservable();
     }
     get totalSalesMonthly$(): Observable<TotalSalesMonthly[]>
     {
         return this._totalSalesMonthly.asObservable();
     }

     /**
     * Getter for settlement
     *
    */
    get settlement$(): Observable<Settlement[]>
    {
        return this._settlement.asObservable();
    }
    
    /**
     * Getter for pagination
     */
    get settlementPagination$(): Observable<SettlementPagination>
    {
        return this._settlementPagination.asObservable();
    }

    /**
     * Setter for settlement
     *
     * @param value
     */
    set settlement(value: Settlement[])
    {
        // Store the value
        this._settlement.next(value);
    }

    /**
     * Getter for weekly sale
     *
    */
     get weeklySale$(): Observable<WeeklySale[]>
     {
         return this._weeklySale.asObservable();
     }

    /**
     * Getter for storeId
     */

    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    /**
     * Getter for access token
     */

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }    

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(): Observable<any>
    {
        return this._httpClient.get('api/dashboards/project').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }

    getDailyTopProducts(id: string, page: number = 0, size: number = 10, sort: string = 'date', order: 'asc' | 'desc' | '' = 'asc', 
                        search: string = '', from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ pagination: DailyTopProductsPagination; dailyTopProducts: DailyTopProducts[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortBy: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                startDate: '' + from,
                endDate: '' + to,
            }
        };
        
        return this._httpClient.get<{ pagination: DailyTopProductsPagination; dailyTopProducts: DailyTopProducts[] }>
            (reportService + '/store/' + id + '/report/merchantDailyTopProducts', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getDailyTopProducts)",response);

                    // Pagination
                    let _pagination = {
                        length: response["data"].totalElements,
                        size: response["data"].size,
                        page: response["data"].number,
                        lastPage: response["data"].totalPages,
                        startIndex: response["data"].pageable.offset,
                        endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    };
                    this._logging.debug("Response from StoresService (getDailyTopProducts pagination)",_pagination);
                    

                    this._dailyTopProductsPagination.next(_pagination);
                    this._dailyTopProducts.next(response["data"].content);
                })
            );
    }

    getDetailedDailySales(id: string, page: number = 0, size: number = 10, sort: string = 'created', order: 'asc' | 'desc' | '' = 'asc', 
                        from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ pagination: DetailedDailySalesPagination; detailedDailySales: DetailedDailySales[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortBy: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                startDate: '' + from,
                endDate: '' + to,
            }
        };
        
        return this._httpClient.get<{ pagination: DetailedDailySalesPagination; detailedDailySales: DetailedDailySales[] }>
            (reportService + '/store/' + id + '/report/merchantDetailedDailySales', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getDetailedDailySales)",response);

                    // Pagination
                    let _pagination = {
                        length: response["data"].totalElements,
                        size: response["data"].size,
                        page: response["data"].number,
                        lastPage: response["data"].totalPages,
                        startIndex: response["data"].pageable.offset,
                        endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    };
                    this._logging.debug("Response from StoresService (getDetailedDailySales pagination)",_pagination);

                    this._detailedDailySalesPagination.next(_pagination);
                    this._detailedDailySales.next(response["data"].content);
                })
            );
    }

    getSummarySales(id: string, page: number = 0, size: number = 10, sort: string = 'date', order: 'asc' | 'desc' | '' = 'asc', 
                    search: string = '', from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ pagination: SummarySalesPagination; summarySales: SummarySales[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortBy: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                from: '' + from,
                to: '' + to,
            }
        };
        
        return this._httpClient.get<{ pagination: SummarySalesPagination; summarySales: SummarySales[] }>
            (reportService + '/store/' + id + '/merchant_daily_sales', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getSummarySales)",response);

                    // Pagination
                    let _pagination = {
                        length: response["data"].totalElements,
                        size: response["data"].size,
                        page: response["data"].number,
                        lastPage: response["data"].totalPages,
                        startIndex: response["data"].pageable.offset,
                        endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    };

                    this._logging.debug("Response from StoresService (getSummarySales pagination)",_pagination);

                    this._summarySalesPagination.next(_pagination);
                    this._summarySales.next(response["data"].content);
                })
            );
    }

    getTotalSales(id: string):
    Observable<{ totalSalesTotal: TotalSalesTotal[]; totalSalesDaily: TotalSalesDaily[]; 
        totalSalesWeekly: TotalSalesWeekly[]; totalSalesMonthly: TotalSalesMonthly[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<{ totalSalesTotal: TotalSalesTotal[]; totalSalesDaily: TotalSalesDaily[]; 
            totalSalesWeekly: TotalSalesWeekly[]; totalSalesMonthly: TotalSalesMonthly[] }>
            (reportService + '/store/' + id + '/totalSales', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getTotalSales)", response);

                    this._totalSalesTotal.next(response["totalSales"]);
                    this._totalSalesDaily.next(response["dailySales"]);
                    this._totalSalesWeekly.next(response["weeklySales"]);
                    this._totalSalesMonthly.next(response["monthlySales"]);
                })
            );
    }

    

    getSettlement(id: string, page: number = 0, size: number = 10, sort: string = 'created', order: 'cycleStartDate' | 'cycleEndDate' | '' = 'cycleStartDate', 
                        from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ pagination: SettlementPagination; settlement: Settlement[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortBy: '' + sort,
                sortingOrder: '' + order,
                from: '' + from,
                to: '' + to,
            }
        };
        
        return this._httpClient.get<{ pagination: SettlementPagination; settlement: Settlement[] }>
            (reportService + '/store/' + id + '/settlement', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getSettlement)", response);

                    // Pagination
                    let _pagination = {
                        length: response["data"].totalElements,
                        size: response["data"].size,
                        page: response["data"].number,
                        lastPage: response["data"].totalPages,
                        startIndex: response["data"].pageable.offset,
                        endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    };
                    this._logging.debug("Response from StoresService (getSettlement pagination)", _pagination);

                    this._settlementPagination.next(_pagination);
                    this._settlement.next(response["data"].content);
                })
            );
    }

    getWeeklySale(id: string, from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ weeklySale: WeeklySale[] }>
    {
        let reportService = this._apiServer.settings.apiServer.reportService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),

            params: {
                from: '' + from,
                to: '' + to,
            }
        };
        
        return this._httpClient.get<{ weeklySale: WeeklySale[] }>
            (reportService + '/store/' + id + '/weeklySale', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getWeeklySale)", response);

                    this._weeklySale.next(response["weeklySales"]);
                })
            );
    }
}
