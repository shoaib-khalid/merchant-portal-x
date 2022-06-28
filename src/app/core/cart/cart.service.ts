import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { Cart, CartItem, CustomerCart, CartById } from 'app/core/cart/cart.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class CartService
{
    private _cart: ReplaySubject<Cart> = new ReplaySubject<Cart>(1);
    private _cartItems: ReplaySubject<CartItem[]> = new ReplaySubject<CartItem[]>(1);
    private _customerCarts: ReplaySubject<CustomerCart> = new ReplaySubject<CustomerCart>(1);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _authService: AuthService,
        private _jwtService: JwtService,
        private _logging: LogService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for cart
     *
     * @param value
     */
    set cart(value: Cart)
    {
        // Store the value
        this._cart.next(value);
    }

    get cart$(): Observable<Cart>
    {
        return this._cart.asObservable();
    }

    /**
     * Setter & getter for cartItem
     *
     * @param value
     */
    set cartItems(value: CartItem[])
    {
        // Store the value
        this._cartItems.next(value);
    }

    get cartItems$(): Observable<CartItem[]>
    {
        return this._cartItems.asObservable();
    }

    /**
     * Setter for cartId local storage
     */
    set cartId(value: string) {
        localStorage.setItem('cartId', value);
    }

    /**
     * Getter for cartId local storage
     */
    get cartId$(): string
    {
        return localStorage.getItem('cartId') ?? '';
    }

    /**
     * Getter for customerCarts
     */
    get customerCarts$(): Observable<CustomerCart>
    {
        return this._customerCarts.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // -------------
    // Cart
    // -------------

    /**
     * 
     * @param customerId 
     * @returns 
     */
    getCarts(cartId?: string, customerId?: string, storeId?: string): Observable<Cart[]>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`),
            params: {
                cartId,
                customerId,
                storeId,
            }
        };

        // Delete empty value
        Object.keys(header.params).forEach(key => {

            if (Array.isArray(header.params[key])) {
                header.params[key] = header.params[key].filter(element => element !== null)
            }
            if (!header.params[key]) {
                delete header.params[key];
            }
        });

        return this._httpClient.get<any>(orderService + '/carts', header)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(async (response: any) => {
                    this._logging.debug("Response from CartService (getCarts)", response);

                    return response["data"].content;
                })
            );
    }

    /**
     * 
     * @param customerId 
     * @returns 
     */
    getCartsById(id: string): Observable<CartById>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`),
            params: {
                id
            }
        };

        return this._httpClient.get<any>(orderService + '/carts/' + id, header)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(async (response: any) => {
                    this._logging.debug("Response from CartService (getCartsById)", response);

                    return response["data"];
                })
            );
    }

    /**
     * (Used by app.resolver)
     * 
     * @param customerId 
     * @returns 
     */
    getCartsByCustomerId(customerId: string): Observable<CustomerCart>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`),
            params: {
                customerId
            }
        };

        return this._httpClient.get<any>(orderService + '/carts/customer', header)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(async (response: any) => {
                                
                    this._logging.debug("Response from CartService (getCartsByCustomerId)", response);
                
                    // set customer cart
                    this._customerCarts.next(response["data"]);

                    return response["data"];
                })
            );
    }
    
    /**
     * Create the cart
     *
     * @param cart
     */
    createCart(cart: Cart): Observable<any>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this._httpClient.post<any>(orderService + '/carts', cart, header)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(async (response: any) => {
                    this._logging.debug("Response from StoresService (createCart)",response);

                    // set cart id
                    this.cartId = response["data"].id;

                    // set cart
                    this._cart.next(response);

                    return response["data"];
                })
            );
    }

    /**
     * Update the cart
     *
     * @param cart
     */
    updateCart(cart: Cart): Observable<any>
    {
        return this._httpClient.patch<Cart>('api/common/cart', {cart}).pipe(
            map((response) => {
                this._cart.next(response);
            })
        );
    }

    deleteCartbyId(cartId: string):  Observable<any>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this._httpClient.delete<any>(orderService + '/carts/' + cartId, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (deleteCart)",response);

                    return response["data"];
                })
            );
    }


    // -------------
    // Cart Items
    // -------------

    /**
     * Get the current logged in cart data
     */
    getCartItems(id: string): Observable<Cart>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this._httpClient.get<any>(orderService + '/carts/' + id + '/items', header)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(async (response: any) => {
                    this._logging.debug("Response from StoresService (getCartItems)", response);

                    let resp = response ? response["data"].content : null;
                    // set cart id
                    this._cartItems.next(resp);

                    return resp;
                        
                })
            );
    }

    postCartItem(cartId: string, cartItem: CartItem):  Observable<CartItem>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this.cartItems$.pipe(
            take(1),
            switchMap(cartItems => this._httpClient.post<any>(orderService + '/carts/' + cartId + '/items', cartItem, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (postCartItem)",response);

                    let index = cartItems.findIndex(item => item.id === response["data"].id);

                    if (index > -1) {
                        // update if existing cart item id exists
                        cartItems[index] = { ...cartItems[index], ...response["data"]};
                        this._cartItems.next(cartItems);
                    } else {
                        // add new if cart item not exist yet in cart
                        this._cartItems.next([response["data"], ...cartItems]);
                    }

                    return response["data"];
                })
            ))
        );
    }

    putCartItem(cartId: string, cartItem: CartItem, itemId: string):  Observable<CartItem>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this.cartItems$.pipe(
            take(1),
            switchMap(cartItems => this._httpClient.put<any>(orderService + '/carts/' + cartId + '/items/' + itemId, cartItem, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (postCartItem)",response);

                    let index = cartItems.findIndex(item => item.id === response["data"].id);

                    if (index > -1) {
                        // update if existing cart item id exists
                        cartItems[index] = { ...cartItems[index], ...response["data"]};
                        this._cartItems.next(cartItems);
                    } else {
                        // add new if cart item not exist yet in cart
                        this._cartItems.next([response["data"], ...cartItems]);
                    }

                    return response["data"];
                })
            ))
        );
    }

    deleteCartItem(cartId: string, itemId: string):  Observable<CartItem>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${this._authService.publicToken}`)
        };

        return this.cartItems$.pipe(
            take(1),
            switchMap(cartItems => this._httpClient.delete<any>(orderService + '/carts/' + cartId + '/items/' + itemId, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (deleteCartItem)",response);

                    let index = cartItems.findIndex(item => item.id === itemId);

                    if (index > -1) {
                        // Delete the cartItems
                        cartItems.splice(index, 1);

                        // Update the products
                        this._cartItems.next(cartItems);
                    }

                    return response["data"];
                })
            ))
        );
    }

    updateItemPrice(cartId: string = null, itemCode: string): Observable<CartItem>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `${this._authService.publicToken}`)
        };

        return this._httpClient.post<CartItem>( orderService + '/carts/' + cartId + '/items/updateprice/' + itemCode, header ).pipe(
            tap((response) => {
                this._logging.debug("Response from OrderService (updateItemPrice)", response);
            })
        );
    }

    deleteItem(cartId: string = null, itemCode: string): Observable<CartItem>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `${this._authService.publicToken}`)
        };

        return this._httpClient.post<CartItem>( orderService + '/carts/' + cartId + '/items/deleteitem/' + itemCode, header ).pipe(
            tap((response) => {
                this._logging.debug("Response from OrderService (deleteItem)", response);
            })
        );
    }

}
