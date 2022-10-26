import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DiscountsService } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.service';
import { Discount, DiscountPagination } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.types';
import { Product, ProductPagination } from 'app/core/product/inventory.types';
import { DiscountsProductService } from '../../product-discount/product-discount-list/product-discount-list.service';

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
        // return this._discountService.getDiscounts();
        return this._discountService.getByQueryDiscounts(0, 20, 'startDate', 'asc', '','','SHIPPING, TOTALSALES');
    }
}

@Injectable({
    providedIn: 'root'
})
export class DiscountsProductResolver implements Resolve<any>
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
        return this._discountService.getByQueryDiscounts(0, 20, 'startDate', 'asc', '','','ITEM');
    }
}

@Injectable({
    providedIn: 'root'
})
export class InventoryProductsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _productDiscountService: DiscountsProductService)
    {
    }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        return this._productDiscountService.getByQueryProducts(0,10,'name','asc','','ACTIVE,INACTIVE');

    }
}
