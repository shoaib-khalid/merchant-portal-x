import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { MatPaginator } from '@angular/material/paginator';
import { combineLatest, merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ChooseStoreService } from 'app/modules/merchant/stores-management/choose-store/choose-store.service';
import { StoreCategory, Store, StorePagination } from 'app/core/store/store.types';
import { InventoryService } from 'app/core/product/inventory.service'
import { StoresService } from 'app/core/store/store.service';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';

@Component({
    selector       : 'choose-store',
    templateUrl    : './choose-store.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseStoreComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    categories: StoreCategory[];
    stores$: Observable<Store[]>;
    filteredStores: Store[] = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    pagination: StorePagination;
    isLoading: boolean = false;

    filterControl: FormControl = new FormControl();
    sortName: 'asc' | 'desc' | '' = 'asc';
    searchName: string = "";

    categoryFilterControl: FormControl = new FormControl();
    filteredCategory: string = "";

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _fuseConfirmationService: FuseConfirmationService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _chooseStoreService: ChooseStoreService,
        private _inventoryService: InventoryService,
        private _storesService: StoresService

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
        this._storesService.stores$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((stores: Store[]) => {
                this.filteredStores = stores;
            });

        // Get the store
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {
                // console.log("cini: ",store)
            });

        // Get the pagination
        this._storesService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: StorePagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.filterControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {

                    // since sortName and searchName share same input field 
                    // below if statement is needed
                    if (typeof(query) === "boolean") {
                        query = "";
                    } else if (query === null){
                        query = "";
                    }
                    else {
                        this.searchName = query;
                    }

                    this.isLoading = true;
                    return this._storesService.getStores("",0, 10, 'name', this.sortName, this.searchName, this.filteredCategory);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this.categoryFilterControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {

                    // if categor not 'all' or null
                    if (query !== "all" || query !== null) {
                        this.filteredCategory = query;
                    } else {
                        this.filteredCategory = "";
                    }

                    this.isLoading = true;
                    return this._storesService.getStores("",0, 10, 'name', this.sortName, this.searchName, this.filteredCategory);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();
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

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {

        if ( this._paginator )
        {

            // Mark for check
            this._changeDetectorRef.markForCheck();
            
            // Get products if sort or page changes
            merge(this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    return this._storesService.getStores("", this._paginator.pageIndex, this._paginator.pageSize,"name", this.sortName, this.searchName, this.filteredCategory);
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    toggleSortName(){
        this.sortName = (this.sortName === 'asc') ? 'desc' : 'asc';
    }

    clearFilter(){
        this.sortName = 'asc';
        this.searchName = "";

        this.filterControl.reset();

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

    async pageRedirect(storeId: string, pageType: string = null) {
        this.storeId = storeId;
        await this._storesService.getStoresById(storeId)
            .subscribe((store: Store)=>{
                this._storesService.store = store;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        await this._inventoryService.getProducts().subscribe((response)=>{

            if (pageType === "editPage")
                this._router.navigateByUrl('/stores/edit/'+ storeId)
            else if (response["data"]["content"].length < 1)
                this._router.navigateByUrl('/products/inventory')
            else
                this._router.navigateByUrl('/dashboard')
        })
    }

    /**
     * Delete the selected product using the form data
     */
     deleteStore(storeId: string): void
     {
         // Open the confirmation dialog
         const confirmation = this._fuseConfirmationService.open({
             title  : 'Delete product',
             message: 'Are you sure you want to remove this store ? This action cannot be undone!',
             actions: {
                 confirm: {
                     label: 'Delete'
                 }
             }
         });
 
         // Subscribe to the confirmation dialog closed action
         confirmation.afterClosed().subscribe((result) => {
 
            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Delete the product on the server
                this._storesService.delete(storeId).subscribe(() => {
                    
                    // empty out storeId
                    this.storeId = null;
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
            });
            }
         });
     }
    
}
