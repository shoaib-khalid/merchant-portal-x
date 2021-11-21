import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ChannelsListService } from 'app/modules/merchant/social-media/channels-list/channels-list.service';

@Injectable({
    providedIn: 'root'
})
export class ChannelsListResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _channelsListService: ChannelsListService)
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
        return this._channelsListService.getChannels();
    }
}
