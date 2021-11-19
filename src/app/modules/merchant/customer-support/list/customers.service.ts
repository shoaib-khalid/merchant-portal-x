import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Customer, CustomerPagination } from 'app/modules/merchant/customer-support/list/customers.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';

@Injectable({
    providedIn: 'root'
})
export class CustomersService
{
    // Private
    private _customer: BehaviorSubject<Customer | null> = new BehaviorSubject(null);
    private _customers: BehaviorSubject<Customer[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<CustomerPagination | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _jwt: JwtService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for customer
     */
    get customer$(): Observable<Customer>
    {
        return this._customer.asObservable();
    }

    /**
     * Getter for customers
     */
    get customers$(): Observable<Customer[]>
    {
        return this._customers.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<CustomerPagination>
    {
        return this._pagination.asObservable();
    }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     }

    /**
     * Getter for storeId
     */
 
     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get customers
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getCustomers(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE'):
        Observable<{ pagination: CustomerPagination; customer: Customer[] }>
    {
        let productService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                //sortByCol: '' + sort,
                //sortingOrder: '' + order.toUpperCase(),
                //name: '' + search,
                //status: '' + status
            }
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/customers/', header).pipe(
            tap((response) => {

                this._logging.debug("Response from CustomersService",response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                // let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
                this._pagination.next(_pagination);
                this._customers.next(response.data.content);
            })
        );
    }

    /**
     * Get customer by id
     */
    getCustomerById(id: string): Observable<Customer>
    {
        return this._customers.pipe(
            take(1),
            map((customers) => {

                // Find the customer
                const customer = customers.find(item => item.id === id) || null;

                this._logging.debug("Response from CustomersService (Current Customer)",customer);

                // Update the customer
                this._customer.next(customer);

                // Return the customer
                return customer;
            }),
            switchMap((customer) => {

                if ( !customer )
                {
                    return throwError('Could not found customer with id of ' + id + '!');
                }

                return of(customer);
            })
        );
    }

    /**
     * Create customer
     */
    createCustomer(categoryId): Observable<Customer>
    {
        let productService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        const body = {
            "categoryId": categoryId,
            "name": "A New Customer " + date,
            "status": "INACTIVE",
            "description": "Tell us more about your customer",
            "storeId": this.storeId$,
            "allowOutOfStockPurchases": false,
            "trackQuantity": false,
            "minQuantityForAlarm": -1
        };

        return this.customers$.pipe(
            take(1),
            // switchMap(customers => this._httpClient.post<InventoryCustomer>('api/apps/ecommerce/inventory/customer', {}).pipe(
            switchMap(customers => this._httpClient.post<Customer>(productService + '/stores/' + this.storeId$ + '/customers', body , header).pipe(
                map((newCustomer) => {

                    // Update the customers with the new customer
                    this._customers.next([newCustomer["data"], ...customers]);

                    // Return the new customer
                    return newCustomer;
                })
            ))
        );
    }

    /**
     * Update customer
     *
     * @param id
     * @param customer
     */
    updateCustomer(id: string, customer: Customer): Observable<Customer>
    {
        let productService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.customers$.pipe(
            take(1),
            // switchMap(customers => this._httpClient.post<InventoryCustomer>('api/apps/ecommerce/inventory/customer', {}).pipe(
            switchMap(customers => this._httpClient.put<Customer>(productService + '/stores/' + this.storeId$ + '/customers/' + id, customer , header).pipe(
                map((updatedCustomer) => {

                    console.log("customers: ",customers);
                    console.log("updatedCustomer: ",updatedCustomer);

                    // Find the index of the updated customer
                    const index = customers.findIndex(item => item.id === id);

                    // Update the customer
                    customers[index] = { ...customers[index], ...updatedCustomer["data"]};

                    console.log("customers[index]", customers[index])

                    // Update the customers
                    this._customers.next(customers);

                    // Return the updated customer
                    return updatedCustomer["data"];
                }),
                switchMap(updatedCustomer => this.customer$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the customer if it's selected
                        this._customer.next(updatedCustomer["data"]);

                        // Return the updated customer
                        return updatedCustomer["data"];
                    })
                ))
            ))
        );
    }

    /**
     * Delete the customer
     *
     * @param id
     */
    deleteCustomer(id: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.customers$.pipe(
            take(1),
            switchMap(customers => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/customers/'+id, header).pipe(
                map((status: number) => {

                    // Find the index of the deleted customer
                    const index = customers.findIndex(item => item.id === id);

                    // Delete the customer
                    customers.splice(index, 1);

                    // Update the customers
                    this._customers.next(customers);

                    let isDeleted:boolean = false;
                    if (status === 200) {
                        isDeleted = true
                    }

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

}
