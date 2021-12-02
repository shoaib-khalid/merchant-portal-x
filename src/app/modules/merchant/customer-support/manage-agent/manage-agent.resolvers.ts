import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ManageAgentService } from './manage-agent.service';
import { Agent, AgentPagination } from './manage-agent.types';

@Injectable({
    providedIn: 'root'
})
export class ManageAgentResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _manageAgentService: ManageAgentService)
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
        return this._manageAgentService.getAgent();
    }
}
