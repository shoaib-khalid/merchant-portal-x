import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomersService } from 'app/modules/merchant/customer-support/list/customers.service';
import { Customer, CustomerPagination } from 'app/modules/merchant/customer-support/list/customers.types';

@Injectable({
    providedIn: 'root'
})
export class CustomersResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _customerService: CustomersService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: CustomerPagination; customer: Customer[] }>
    {
        return this._customerService.getCustomers();
    }
}
