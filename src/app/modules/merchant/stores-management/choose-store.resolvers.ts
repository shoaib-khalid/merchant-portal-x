import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreCategory, Store } from 'app/core/store/store.types';
import { ChooseStoreService } from 'app/modules/merchant/stores-management/choose-store.service';

@Injectable({
    providedIn: 'root'
})
export class ChooseStoreCategoriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _chooseStoreService: ChooseStoreService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<StoreCategory[]>
    {
        return this._chooseStoreService.getCategories();
    }
}

@Injectable({
    providedIn: 'root'
})
export class ChooseStoresResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _chooseStoreService: ChooseStoreService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Store[]>
    {
        return this._chooseStoreService.getStores();
    }
}

@Injectable({
    providedIn: 'root'
})
export class ChooseStoreResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _chooseStoreService: ChooseStoreService
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Store>
    {
        return this._chooseStoreService.getStoreById(route.paramMap.get('id'))
                   .pipe(
                       // Error here means the requested task is not available
                       catchError((error) => {

                           // Log the error
                           console.error(error);

                           // Get the parent url
                           const parentUrl = state.url.split('/').slice(0, -1).join('/');

                           // Navigate to there
                           this._router.navigateByUrl(parentUrl);

                           // Throw an error
                           return throwError(error);
                       })
                   );
    }
}
