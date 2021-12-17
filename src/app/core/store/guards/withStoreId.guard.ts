import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StoresService } from '../store.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Injectable({
    providedIn: 'root'
})
export class WithStoreIdGuard implements CanActivate, CanActivateChild, CanLoad
{

    /**
     * Constructor
     */
    constructor(
        private _storesService: StoresService,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Can activate
     *
     * @param route
     * @param state
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean
    {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._checkStoreSelected();
    }

    /**
     * Can activate child
     *
     * @param childRoute
     * @param state
     */
    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        return this._checkStoreSelected();
    }

    /**
     * Can load
     *
     * @param route
     * @param segments
     */
    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean
    {
        return this._checkStoreSelected();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Check the authenticated status
     *
     * @param redirectURL
     * @private
     */
    private _checkStoreSelected(): Observable<boolean>
    {
        // Check the authentication status
        let storeId = this._storesService.storeId$;
        
        if (!storeId) {
            // Redirect to the choose-store page
            this._router.navigate(['stores']);

            // Alert the user
            // alert("Please choose a store first");

            this._fuseConfirmationService.open({
                "title": "No store selected",
                "message": "Please choose a store first",
                "icon": {
                  "show": true,
                  "name": "heroicons_outline:exclamation",
                  "color": "warn"
                },
                "actions": {
                  "confirm": {
                    "show": false,
                    "label": "Remove",
                    "color": "warn"
                  },
                  "cancel": {
                    "show": true,
                    "label": "OK"
                  }
                },
                "dismissible": false
              });
            // Prevent the access
            return of(false);

            
        }

        // Allow the access
        return of(true);
    }
    
}
