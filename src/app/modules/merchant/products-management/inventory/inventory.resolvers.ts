import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductCategory, ProductCategoryPagination, ProductPagination, ProductVariant } from 'app/core/product/inventory.types';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { JwtService } from 'app/core/jwt/jwt.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryCategoriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ProductCategoryPagination; products: ProductCategory[] }>
    
    {
        return this._inventoryService.getByQueryCategories();
    }
}

@Injectable({
    providedIn: 'root'
})
export class InventoryProductResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _inventoryService: InventoryService,
        private _router: Router
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Product>
    {
        return this._inventoryService.getProductById(route.paramMap.get('id'))
                   .pipe(
                       // Error here means the requested product is not available
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
                   );
    }
}

@Injectable({
    providedIn: 'root'
})
export class InventoryProductsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        return this._inventoryService.getProducts();
    }
}

// @Injectable({
//     providedIn: 'root'
// })
// export class InventoryTagsResolver implements Resolve<any>
// {
//     /**
//      * Constructor
//      */
//     constructor(private _inventoryService: InventoryService)
//     {
//     }

//     // -----------------------------------------------------------------------------------------------------
//     // @ Public methods
//     // -----------------------------------------------------------------------------------------------------

//     /**
//      * Resolver
//      *
//      * @param route
//      * @param state
//      */
//     resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProductVariant[]>
//     {
//         return this._inventoryService.getVariants();
//     }
// }

@Injectable({
    providedIn: 'root'
})
export class GetStoreByIdResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _storesService: StoresService,
        private _inventoryService: InventoryService,)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

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
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Store>
    {
        return this._storesService.getStoreById(this.storeId$)
            .pipe(
                tap(store => {
                    this._inventoryService.getParentCategories(0, 50, 'name', 'asc', '', store.verticalCode).subscribe();
                    // Query to get 20 stores
                    this._storesService.getStoresList('', 0, 20, 'name', 'asc', '', store.verticalCode ).subscribe()
                })
            )
    }
}

@Injectable({
    providedIn: 'root'
})
export class ProductCategoriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _inventoryService: InventoryService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: ProductCategoryPagination; products: ProductCategory[] }>
    
    {
        return this._inventoryService.getByQueryCategories(0 , 30, 'sequenceNumber', 'asc');
    }
}

@Injectable({
    providedIn: 'root'
})
export class ClientResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _jwtService: JwtService,
        private _authService: AuthService,
        private _userService: UserService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProductVariant[]>
    {
        return this._userService.getClientForInventory(this._jwtService.getJwtPayload(this._authService.jwtAccessToken).uid)
    }
}

