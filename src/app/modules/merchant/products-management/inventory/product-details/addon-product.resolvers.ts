import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from "@angular/router";
import { InventoryService } from "app/core/product/inventory.service";
import { catchError, forkJoin, Observable, of, switchMap, take, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AddOnGroupOnProductResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _inventoryService: InventoryService,
        private _router: Router
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

        return forkJoin([
            this._inventoryService.getAddOnGroupsOnProduct({productId: route.paramMap.get('id')}),
            this._inventoryService.getAddOnItemsOnProduct({productId: route.paramMap.get('id')})
        ])
    }
}