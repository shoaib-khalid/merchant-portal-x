import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { FlowsListService } from 'app/modules/merchant/social-media/flows-list/flows-list.service';

@Injectable({
    providedIn: 'root'
})
export class FlowsListResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _flowsListService: FlowsListService)
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
        return this._flowsListService.getFlows();
    }
}
