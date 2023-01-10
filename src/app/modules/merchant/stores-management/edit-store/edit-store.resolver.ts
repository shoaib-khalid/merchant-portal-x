import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.types'
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.service';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { LocationService } from 'app/core/location-service/location.service';

@Injectable({
    providedIn: 'root'
})
export class ChooseVerticalsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _chooseVerticalService: ChooseVerticalService
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Vertical[]>
    {
        return this._chooseVerticalService.getVerticals()
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
        private _storesService: StoresService,
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
        return this._storesService.getStoreById(route.paramMap.get('id'))
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

// @Injectable({
//     providedIn: 'root'
// })
// export class StoreTagResolver implements Resolve<any>
// {
//     /**
//      * Constructor
//      */
//     constructor(
//         private _router: Router,
//         private _locationService: LocationService
//     )
//     {
//     }

//     // -----------------------------------------------------------------------------------------------------
//     // @ Public methods
//     // -----------------------------------------------------------------------------------------------------

//     /**
//      * Resolver
//      *
//      * @param route
//      * @param state
//      */
//     resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
//     {
        
//         return this._locationService.getTagDetails(route.paramMap.get('storeid'))
//             .pipe(
//                 // Error here means the requested task is not available
//                 catchError((error) => {

//                     // Log the error
//                     console.error(error);

//                     // Get the parent url
//                     const parentUrl = state.url.split('/').slice(0, -1).join('/');

//                     // Navigate to there
//                     this._router.navigateByUrl(parentUrl);

//                     // Throw an error
//                     return throwError(error);
//                 })
//             );
//     }
// }
