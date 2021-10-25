import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChooseStoreService } from 'app/modules/merchant/stores-management/choose-store.service';
import { StoreCategory, Store } from 'app/core/store/store.types';
import { InventoryService } from 'app/core/product/inventory.service'

@Component({
    selector       : 'choose-store-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseStoreListComponent implements OnInit, OnDestroy
{
    categories: StoreCategory[];
    stores: Store[];
    filteredStores: Store[];
    filters: {
        categorySlug$: BehaviorSubject<string>;
        query$: BehaviorSubject<string>;
        hideCompleted$: BehaviorSubject<boolean>;
    } = {
        categorySlug$ : new BehaviorSubject('all'),
        query$        : new BehaviorSubject(''),
        hideCompleted$: new BehaviorSubject(false)
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _chooseStoreService: ChooseStoreService,
        private _inventoryService: InventoryService

    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for storeId
     */
     set storeId(str: string)
     {
         localStorage.setItem('storeId', str);
     }
 
     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the categories
        this._chooseStoreService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: StoreCategory[]) => {
                this.categories = categories;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the stores
        this._chooseStoreService.stores$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((stores: Store[]) => {
                this.stores = this.filteredStores = stores;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Filter the stores
        combineLatest([this.filters.categorySlug$, this.filters.query$, this.filters.hideCompleted$])
            .subscribe(([categorySlug, query, hideCompleted]) => {

                // Reset the filtered stores
                this.filteredStores = this.stores;

                // Filter by category
                if ( categorySlug !== 'all' )
                {
                    this.filteredStores = this.filteredStores.filter(store => store.category === categorySlug);
                }

                // Filter by search query
                if ( query !== '' )
                {
                    this.filteredStores = this.filteredStores.filter(store => store.name.toLowerCase().includes(query.toLowerCase())
                        || store.storeDescription.toLowerCase().includes(query.toLowerCase())
                        || store.category.toLowerCase().includes(query.toLowerCase()));
                }

                // Filter by completed
                if ( hideCompleted )
                {
                    this.filteredStores = this.filteredStores.filter(store => store.progress.completed === 0);
                }
            });
    }

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
     * Filter by search query
     *
     * @param query
     */
    filterByQuery(query: string): void
    {
        this.filters.query$.next(query);
    }

    /**
     * Filter by category
     *
     * @param change
     */
    filterByCategory(change: MatSelectChange): void
    {
        this.filters.categorySlug$.next(change.value);
    }

    /**
     * Show/hide completed stores
     *
     * @param change
     */
    toggleCompleted(change: MatSlideToggleChange): void
    {
        this.filters.hideCompleted$.next(change.checked);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    /**
     * Redirect page after client choose store
     * 
     * @param storeId
     */

    async pageRedirect(storeId: string){
        this.storeId = storeId;
        await this._inventoryService.getProducts().subscribe((response)=>{

            if (response["data"]["content"].length < 1)
                this._router.navigateByUrl('/products/inventory')
            else
                this._router.navigateByUrl('/dashboard')
        })
    }
    
}
