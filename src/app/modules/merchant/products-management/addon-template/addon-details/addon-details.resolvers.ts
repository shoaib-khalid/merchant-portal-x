import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from "@angular/router";
import { InventoryService } from "app/core/product/inventory.service";
import { catchError, Observable, of, switchMap, take, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AddOnGroupTemplateResolver implements Resolve<any>
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
        return this._inventoryService.getAddOnGroupTemplateById(route.paramMap.get('id'))
                   .pipe(
                        // Error here means the requested product is not available
                        catchError((error) => {

                            // Log the error
                            console.error(error);

                            // Get the parent url
                            const parentUrl = state.url.split('/').slice(0, -1).join('/');

                            // Navigate to there
                            this._router.navigateByUrl(parentUrl);

                            // Throw an error
                            return throwError(error);
                        }),
                        take(1),
                        switchMap((groupTemplate) => {
                                return this._inventoryService.getAddOnItemTemplates({ page: 0, pageSize: 20, groupId: groupTemplate.id })
                        }),
                   );

    }
}