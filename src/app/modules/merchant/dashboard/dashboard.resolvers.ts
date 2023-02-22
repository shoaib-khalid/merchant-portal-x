import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { DashboardService } from 'app/modules/merchant/dashboard/dashboard.service';
import { OrdersListService } from '../orders-management/orders-list/orders-list.service';
import { formatDate } from '@angular/common';
import { StoresService } from 'app/core/store/store.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _dashboardService: DashboardService, 
        private _storesService: StoresService
    )
    {
    }

    /**
     * Getter for storeId
     */

    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return forkJoin([
            // this._dashboardService.getData(),
            this._storesService.getStoreById(this.storeId$)
        ]);
    }
}

@Injectable({
    providedIn: 'root'
})
export class DailyTopProductsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._dashboardService.getDailyTopProducts(this.storeId$, 'current');
    }
}

@Injectable({
    providedIn: 'root'
})
export class DetailedDailySalesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._dashboardService.getDetailedDailySales(this.storeId$);
    }
}


@Injectable({
    providedIn: 'root'
})
export class SummarySalesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._dashboardService.getSummarySales(this.storeId$);
    }
}

@Injectable({
    providedIn: 'root'
})
export class TotalSalesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        // return this._dashboardService.getTotalSales(this.storeId$, '');
        return this._dashboardService.getTotalSalesAmount(this.storeId$, '');
    }

}

@Injectable({
    providedIn: 'root'
})
export class SettlementResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._dashboardService.getSettlement(this.storeId$);
    }
}

@Injectable({
    providedIn: 'root'
})
export class WeeklySaleResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._dashboardService.getWeeklySale(this.storeId$);
    }
}

@Injectable({
    providedIn: 'root'
})
export class OrdersListResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _ordersListService: OrdersListService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return forkJoin([
            this._ordersListService.getOrders(),
            this._ordersListService.getOrdersCountSummary('')
        ]);
    }
}

@Injectable({
    providedIn: 'root'
})
export class WeeklyGraphResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _dashboardService: DashboardService)
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

    get prevMonday(): Date
    {
        let today = new Date();

        // get the day of date (0-6)
        let day = today.getDay();
        let prevMonday = new Date();

        // if today is Monday, return today's date
        if (today.getDay() == 0){
            // prevMonday.setDate(date.getDate() - 7);
            return today;
        }
        // else, set prevMonday to previous Monday's date
        else {
            prevMonday.setDate(today.getDate() - (day-1));
        }

        return prevMonday;
    }

    get lastWeek(): {start: string, end: string} {

        let locale = 'en-MY';
        // reformat date
        const format = 'yyyy-MM-dd';

        // get this week monday
        let lastWeekStart = this.prevMonday;

        // set lastWeekStartFixed to last week monday
        const lastWeekStartFixed = new Date(lastWeekStart.setDate(lastWeekStart.getDate() - 7));

        // set lastWeekEnd to end of last week
        let lastWeekEnd = new Date(lastWeekStart.setDate(lastWeekStart.getDate() + 6));

        // reformat date
        let formattedLastWeekStart = formatDate(lastWeekStartFixed, format, locale);
        let formattedLastWeekEnd = formatDate(lastWeekEnd, format, locale);

        return {start: formattedLastWeekStart, end: formattedLastWeekEnd};
    }

    get thisWeek(): {start: string, end: string} {

        let locale = 'en-MY';
        // reformat date
        const format = 'yyyy-MM-dd';
        let today = new Date();

        // get last Monday and today's date
        let lastMonday = this.prevMonday;
        let formattedLastMonday = formatDate(lastMonday, format, locale);
        let formattedToday = formatDate(today, format, locale);


        return {start: formattedLastMonday, end: formattedToday};
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return forkJoin([
                this._dashboardService.getWeeklyGraph(this.storeId$, 'this-week',
                {
                    to: this.thisWeek.end,
                    from: this.thisWeek.start,
                    serviceType: ''
                }),
                this._dashboardService.getWeeklyGraph(this.storeId$, 'last-week',
                {
                    to: this.lastWeek.end,
                    from: this.lastWeek.start,
                    serviceType: ''
                }),
                this._dashboardService.getWeeklySalesGraph(this.storeId$, 'this-week',
                {
                    to: this.thisWeek.end,
                    from: this.thisWeek.start,
                    serviceType: ''
                }),
                this._dashboardService.getWeeklySalesGraph(this.storeId$, 'last-week',
                {
                    to: this.lastWeek.end,
                    from: this.lastWeek.start,
                    serviceType: ''
                }),

                // this._dashboardService.getDailyTopProducts(
                //     this.storeId$, 'this-week',
                //     {
                //         page: 0,
                //         pageSize: 10,
                //         sortBy: 'date',
                //         sortingOrder: 'DESC',
                //         search: '',
                //         startDate: this.thisWeek.start,
                //         endDate: this.thisWeek.end,
                //         serviceType: ''
                //     }),
                // this._dashboardService.getDailyTopProducts(
                //     this.storeId$, 'last-week',
                //     {
                //         page: 0,
                //         pageSize: 10,
                //         sortBy: 'date',
                //         sortingOrder: 'DESC',
                //         search: '',
                //         startDate: this.lastWeek.start,
                //         endDate: this.lastWeek.end,
                //         serviceType: ''
                //     }),
                // this._dashboardService.getStaffTotalSales(
                //     this.storeId$,
                //     {
                //         pageSize: 10,
                //         sortBy: 'created',
                //         sortingOrder: 'ASC',
                //         search: '',
                //         page: 0,
                //         from: '',
                //         to: '',
                //     }
                // ),
                this._dashboardService.getStaffNames(this.storeId$)
            ])
    }
}
