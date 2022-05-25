// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { Vertical } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.types'
// import { StoresDeliveryService } from './store-delivery.service';

// @Injectable({
//     providedIn: 'root'
// })
// export class ChooseVerticalsResolver implements Resolve<any>
// {
//     /**
//      * Constructor
//      */
//     constructor(
//         private _router: Router,
//         private _storeDeliveryService: StoresDeliveryService
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
//     resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Vertical[]>
//     {
//         return this._storeDeliveryService.getStoreRegionCountryStateCity(null,"")
//                    .pipe(
//                         // Error here means the requested task is not available
//                         catchError((error) => {
//                             // Log the error
//                             console.error(error);

//                             // Throw an error
//                             return throwError(error);
//                         })
//                    );
//     }
// }