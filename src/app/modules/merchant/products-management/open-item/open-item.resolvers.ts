import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { ProductPagination, Product } from "app/core/product/inventory.types";
import { StoresService } from "app/core/store/store.service";
import { Store } from "app/core/store/store.types";
import { Observable } from "rxjs";
import { OpenItemService } from "./open-item.service";

@Injectable({
    providedIn: 'root'
})
export class OpenItemResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _openItemService: OpenItemService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        return this._openItemService.getOpenItems();
    }
}

@Injectable({
    providedIn: 'root'
})
export class GetStoreResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _storesService: StoresService
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
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Store>
    {
        return this._storesService.getStoreById(this.storeId$)
            
    }
}