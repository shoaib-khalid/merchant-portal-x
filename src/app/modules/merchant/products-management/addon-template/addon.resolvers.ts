import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { InventoryService } from "app/core/product/inventory.service";
import { ProductPagination, Product, AddOnGroupTemplate } from "app/core/product/inventory.types";
import { StoresService } from "app/core/store/store.service";
import { Observable, switchMap, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AddOnGroupTemplatesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
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
        return this._inventoryService.getAddOnGroupTemplates({page: 0, pageSize: 30, storeId: this.storeId$});
    }
}
