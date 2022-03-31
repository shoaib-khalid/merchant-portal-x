import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.types'
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.service';
import { StoresService } from 'app/core/store/store.service';
import { UserService } from 'app/core/user/user.service';

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
        private _userService: UserService,
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return forkJoin([ 
            this._chooseVerticalService.getVerticals()
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
                ),
            this._userService.getClientById()
        ]);
    }
}