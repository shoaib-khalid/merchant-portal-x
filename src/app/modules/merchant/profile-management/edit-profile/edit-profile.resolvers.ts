import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreCategory, Store, StorePagination } from 'app/core/store/store.types';
import { ChooseStoreService } from 'app/modules/merchant/stores-management/choose-store/choose-store.service';
import { EditProfileService } from './edit-profile.service';
import { Client } from './edit-profile.types';

@Injectable({
    providedIn: 'root'
})
export class EditProfileResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _editProfileService: EditProfileService)
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
        return this._editProfileService.getClient();
    }
}