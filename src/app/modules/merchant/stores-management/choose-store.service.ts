import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { StoreCategory, Store } from 'app/core/store/store.types';
import { StoreService } from 'app/core/store/store.service';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChooseStoreService
{
    // Private
    private _categories: BehaviorSubject<StoreCategory[] | null> = new BehaviorSubject(null);
    private _store: BehaviorSubject<Store | null> = new BehaviorSubject(null);
    private _stores: BehaviorSubject<Store[] | null> = new BehaviorSubject(null);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _storeService: StoreService,
        private _apiServer: AppConfig,
        private _jwt: JwtService
        )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for categories
     */
    get categories$(): Observable<StoreCategory[]>
    {
        return this._categories.asObservable();
    }

    /**
     * Getter for stores
     */
    get stores$(): Observable<Store[]>
    {
        return this._stores.asObservable();
    }

    /**
     * Getter for store
     */
    get store$(): Observable<Store>
    {
        return this._store.asObservable();
    }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     } 

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get categories
     */
    getCategories(): Observable<StoreCategory[]>
    {
        return this._httpClient.get<StoreCategory[]>('api/apps/academy/categories').pipe(
            tap((response: any) => {
                console.log("CATAG: ",response)
                let _catagories = [
                    {
                        id: "FnB",
                        slug: "FnB",
                        name: "Food and Beverages"
                    },
                    {
                        id: "ecommerce",
                        slug: "ecommerce",
                        name: "E-commerce"   
                    }
                ];
                this._categories.next(_catagories);
            })
        );
    }

    /**
     * Get stores
     */
    // getStores(): Observable<Store[]>
    // {
    //     return this._httpClient.get<Store[]>('api/apps/academy/stores').pipe(
    //         tap((response: any) => {
    //             console.log("COURCES: ",response)
    //             let _stores = [
    //                 {
    //                     id: "694e4e5f-f25f-470b-bd0e-26b1d4f64028",
    //                     title: "Basics of Angular",
    //                     slug: "basics-of-angular",
    //                     description: "Introductory store for Angular and framework basics",
    //                     duration: 30,
    //                     totalSteps: 11,
    //                     featured: true,
    //                     progress: {
    //                         completed: 2,
    //                         currentStep: 3
    //                     },
    //                     category: "web",
    //                     completed: 2,
    //                     currentStep: 3
    //                 }
    //             ];
    //             this._stores.next(_stores);
    //         })
    //     );
    // }

    getStores(): any {

        let _storeList;
        this._storeService.store$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((storeList: Store[]) => {
                // this._stores.next(storeList);
                // this.stores = storeList.sort(this.dynamicSort("name"));
                console.log("DANDAN",storeList)
                _storeList = storeList.sort(this.dynamicSort("name"));

                let _stores = [];
                _storeList.forEach(element => {
                    console.log(element.storeDescription)
                    _stores.push(
                        {
                            id: element.id,
                            name: element.name,
                            slug: element.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''),
                            storeDescription: element.name,
                            duration: 30,
                            totalSteps: 3,
                            featured: true,
                            progress: {
                                completed: 2,
                                currentStep: 2
                            },
                            category: element.type,
                            completed: 2,
                            currentStep: 3
                        }
                    );
                });

                console.log("DUNDUN",_stores)
        
                this._stores.next(_stores);
            });      

    }


    // getStores(): any {
    //     this._storeService.store$
    //     let _stores = [
    //         {
    //             id: "694e4e5f-f25f-470b-bd0e-26b1d4f64028",
    //             title: "Basics of Angular",
    //             slug: "basics-of-angular",
    //             description: "Introductory store for Angular and framework basics",
    //             duration: 30,
    //             totalSteps: 11,
    //             featured: true,
    //             progress: {
    //                 completed: 2,
    //                 currentStep: 3
    //             },
    //             category: "web",
    //             completed: 2,
    //             currentStep: 3
    //         }
    //     ];
    //     this._stores.next(_stores);
    // }

    /**
     * Get store by id
     */
    getStoreById(id: string): Observable<Store>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this._httpClient.get<any>(productService + '/stores', header)
        .pipe(
            map((store) => {

                // Update the store
                this._store.next(store.data.content);

                // Return the store
                return store;
            }),
            switchMap((store) => {

                if ( !store )
                {
                    return throwError('Could not found store with id of ' + id + '!');
                }

                return of(store);
            })
        );
    }

    // This fuction used to sort object
    dynamicSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            /* next line works with strings and numbers, 
                * and you may want to customize it to your needs
                */
            var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
            return result * sortOrder;
        }
    }
}
