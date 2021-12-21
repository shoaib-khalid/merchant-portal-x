import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { OrdersListService } from 'app/modules/merchant/orders-management/orders-list/orders-list.service';

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
            this._ordersListService.getOrdersCountSummary()
        ]);
    }
}
