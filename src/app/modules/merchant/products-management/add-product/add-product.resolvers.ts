import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { InventoryService } from "app/core/product/inventory.service";
import { ProductPagination, Product } from "app/core/product/inventory.types";
import { Observable } from "rxjs";

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