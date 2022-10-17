import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { InventoryService } from "app/core/product/inventory.service";
import { ProductPagination, Product } from "app/core/product/inventory.types";
import { StoresService } from "app/core/store/store.service";
import { Observable, switchMap, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ProductsForComboResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
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
        return this._inventoryService.getProductsForCombo();
    }
}

@Injectable({
    providedIn: 'root'
})
export class ParentCategoriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _inventoryService: InventoryService,
        private _storesService: StoresService
        )
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

        return this._storesService.store$
            .pipe(
                tap(store => {
                    this._inventoryService.getParentCategories(0, 50, 'name', 'asc', '', store.verticalCode).subscribe();
                })
            )
    }


}