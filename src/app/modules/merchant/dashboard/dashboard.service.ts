import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { DailyTopProducts, DailyTopProductsPagination, 
         DetailedDailySales, DetailedDailySalesPagination, 
         SummarySales, SummarySalesPagination 
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
     * Setter for dailyTopProducts
     *
     * @param value
     */
    set dailyTopProducts(value: DailyTopProducts[])
    {
        // Store the value
        this._dailyTopProducts.next(value);
    }

    /**
      * Getter for pagination
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
      * Getter for pagination
      */
     get detailedDailySalesPagination$(): Observable<DetailedDailySalesPagination>
     {
         return this._detailedDailySalesPagination.asObservable();
     }

    /**
     * Getter for detailedDailySales
     *
    */
    get summarySales$(): Observable<SummarySales[]>
    {
        return this._summarySales.asObservable();
    }

    /**
     * Setter for detailedDailySales
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
                console.log("dashboard response:",response)
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
            (reportService + '/store/' + id + '/report/dailyTopProducts', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getDailyTopProducts)",response);

                    // Pagination
                    // let _pagination = {
                    //     length: response["data"].totalElements,
                    //     size: response["data"].size,
                    //     page: response["data"].number,
                    //     lastPage: response["data"].totalPages,
                    //     startIndex: response["data"].pageable.offset,
                    //     endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    // };
                    let _pagination = { length: 138, size: 1, page: 0, lastPage: 138, startIndex: 0, endIndex: 0 };
                    this._logging.debug("Response from StoresService (getDailyTopProducts pagination)",_pagination);
                    

                    this._dailyTopProductsPagination.next(_pagination);
                    this._dailyTopProducts.next(response["data"]);
                })
            );
    }

    getDetailedDailySales(id: string, page: number = 0, size: number = 10, sort: string = 'created', order: 'asc' | 'desc' | '' = 'asc', 
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
            (reportService + '/store/' + id + '/report/detailedDailySales', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getDetailedDailySales)",response);

                    // Pagination
                    // let _pagination = {
                    //     length: response["data"].totalElements,
                    //     size: response["data"].size,
                    //     page: response["data"].number,
                    //     lastPage: response["data"].totalPages,
                    //     startIndex: response["data"].pageable.offset,
                    //     endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    // };
                    let _pagination = { length: 138, size: 1, page: 0, lastPage: 138, startIndex: 0, endIndex: 0 };
                    this._logging.debug("Response from StoresService (getDailyTopProducts pagination)",_pagination);

                    this._detailedDailySalesPagination.next(_pagination);
                    this._detailedDailySales.next(response["data"]);
                })
            );
    }

    getSummarySales(id: string, page: number = 0, size: number = 10, sort: string = 'date', order: 'asc' | 'desc' | '' = 'asc', 
                    search: string = '', from: string = this.fromDate, to: string = this.todayDate):
    Observable<{ pagination: SummarySalesPagination; dailyTopProducts: SummarySales[] }>
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
        
        return this._httpClient.get<{ pagination: SummarySalesPagination; dailyTopProducts: SummarySales[] }>
            (reportService + '/store/' + id + '/daily_sales', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from ReportService (getSummarySales)",response);

                    // Pagination
                    // let _pagination = {
                    //     length: response["data"].totalElements,
                    //     size: response["data"].size,
                    //     page: response["data"].number,
                    //     lastPage: response["data"].totalPages,
                    //     startIndex: response["data"].pageable.offset,
                    //     endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                    // };
                    let _pagination = { length: 138, size: 1, page: 0, lastPage: 138, startIndex: 0, endIndex: 0 };
                    this._logging.debug("Response from StoresService (getDailyTopProducts pagination)",_pagination);

                    this._summarySalesPagination.next(_pagination);
                    this._summarySales.next(response["data"].content);
                })
            );
    }
}
