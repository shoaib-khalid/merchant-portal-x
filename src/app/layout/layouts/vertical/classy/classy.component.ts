import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { pipe, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { InventoryService } from 'app/core/product/inventory.service';
import {environment} from 'environments/environment';

@Component({
    selector     : 'classy-layout',
    templateUrl  : './classy.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ClassyLayoutComponent implements OnInit, OnDestroy
{
    isScreenSmall: boolean;
    navigation: Navigation;
    user: User;
    store: Store;
    stores: Store[];
    storeLogo: string;
    currentStoreId: string = "";
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public version: string = environment.appVersion;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _productChangeDetectorRef: InventoryService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _storesService: StoresService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number
    {
        return new Date().getFullYear();
    }

    /**
     * Getter for storeId
    */
 
    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    /**
     * Setter for storeId
    */

    set storeId(str: string)
    {
        localStorage.setItem('storeId', str);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        this.currentStoreId = this.storeId$;

        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to the user service
        this._userService.user$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((user: User) => {
                this.user = user;
            });

        // Subscribe to the store service
        this._storesService.stores$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((stores: Store[]) => {
                this.stores = stores;
            });

        if (this.storeId$) {
            // this is to set current selected store on page init
            this._storesService.getStoreById(this.storeId$)
            .subscribe((store: Store)=>{
                this.store = store;
                this.storeLogo = (this.store.storeAsset) ? this.store.storeAsset.logoUrl : null;
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        }

        this._storesService.storeControl.valueChanges
            .pipe(
                debounceTime(100),
                takeUntil(this._unsubscribeAll),
                switchMap((store: Store) => {
                    this.store = store;
                    this.currentStoreId = store.id;
                    this.storeLogo = (this.store.storeAsset) ? this.store.storeAsset.logoUrl : null;
                    return [];
                })
            )
            .subscribe();

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    // ngAfterViewInit(): void
    // {
    //     setTimeout(() => {
    //         if (this.storeId$) {
    //             // this is to set current selected store on page init
    //             this._storesService.getStoresById(this.storeId$)
    //             .subscribe((store: Store)=>{
    //                 this.store = store;
    //                 this.storeLogo = (this.store.storeAsset) ? this.store.storeAsset.logoUrl : null;
                    
    //                 // Mark for check
    //                 this._changeDetectorRef.markForCheck();
    //             });
    //         }
    //     });
    // }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void
    {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if ( navigation )
        {
            // Toggle the opened status
            navigation.toggle();
        }
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

    openStoreFront(){
        let currentStore = this.store.domain;
        window.open("https://"+currentStore,'_blank');
    }

    changeStore(storeId){
        this.storeId = storeId;
        this._storesService.getStoreById(storeId)
            .subscribe((store: Store)=>{
                this._storesService.store = store;
                this.store = store;

                this.storeLogo = (this.store.storeAsset) ? this.store.storeAsset.logoUrl : null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this._router.navigate(['/dashboard'])
    }
}
