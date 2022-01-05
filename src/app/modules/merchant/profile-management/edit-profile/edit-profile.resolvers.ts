import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreCategory, Store, StorePagination } from 'app/core/store/store.types';
import { ChooseStoreService } from 'app/modules/merchant/stores-management/choose-store/choose-store.service';
import { Client, ClientPaymentDetails } from './edit-profile.types';
import { UserService } from 'app/core/user/user.service';

@Injectable({
    providedIn: 'root'
})
export class GetProfilePaymentResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _userService: UserService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ClientPaymentDetails>
    {
        return this._userService.getClientPaymentDetails();
    }
}


@Injectable({
    providedIn: 'root'
})
export class GetClientResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _userService: UserService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Client>
    {
        return this._userService.getClient();
    }
}