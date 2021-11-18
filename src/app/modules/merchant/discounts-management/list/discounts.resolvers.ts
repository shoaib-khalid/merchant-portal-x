import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DiscountsService } from 'app/modules/merchant/discounts-management/list/discounts.service';
import { Discount, DiscountPagination } from 'app/modules/merchant/discounts-management/list/discounts.types';

@Injectable({
    providedIn: 'root'
})
export class DiscountsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _discountService: DiscountsService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: DiscountPagination; discounts: Discount[] }>
    {
        return this._discountService.getDiscounts();
    }
}
