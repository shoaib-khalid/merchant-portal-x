import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { forkJoin, merge, Observable, of, Subject } from 'rxjs';
import { debounceTime, delay, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from 'app/core/product/inventory.service';
import { AddOnGroupTemplate, ProductCategory, ProductCategoryPagination } from 'app/core/product/inventory.types';
import { Store, StoreAsset } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { SelectionModel } from '@angular/cdk/collections';
import { AddCategoryComponent } from '../../add-category/add-category.component';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector       : 'addon-list',
    templateUrl    : './addon-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class AddOnListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('matDrawer', {static: true}) _drawer: MatDrawer;

    // store id
    storeId: string;
    store: Store;

    addOnGroupTemplates$: Observable<AddOnGroupTemplate[]>;
    templatesList: AddOnGroupTemplate[] = [];

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: UntypedFormControl = new UntypedFormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    openDrawer: boolean = false;
    allSelected: boolean = false;
    selection = new SelectionModel<AddOnGroupTemplate>(true, []);

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: UntypedFormBuilder,
        private _inventoryService: InventoryService,
        private _storesService: StoresService,
        public _dialog: MatDialog,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,

    )
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
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        // Get the addOnGroupTemplates
        this.addOnGroupTemplates$ = this._inventoryService.addOnGroupTemplates$;

        this.addOnGroupTemplates$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((templates: AddOnGroupTemplate[]) => {
                this.templatesList = templates;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            })


        
        // Subscribe to search input field value changes
        // this.searchInputControl.valueChanges
        //     .pipe(
        //         takeUntil(this._unsubscribeAll),
        //         debounceTime(300),
        //         switchMap((query) => {
        //             this.closeDetails();
        //             this.isLoading = true;
        //             return this._inventoryService.getByQueryCategories(0, 10, 'name', 'asc', query);
        //         }),
        //         map(() => {
        //             this.isLoading = false;
        //         })
        //     )
        //     .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
        
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        setTimeout(() => {
            if ( this._sort && this._paginator )
            {
                // Mark for check
                this._changeDetectorRef.markForCheck();

                // Get products if sort or page changes
                merge(this._paginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;
                        return this._inventoryService.getAddOnGroupTemplates({ page: this._paginator.pageIndex, pageSize: this._paginator.pageSize, storeId: this.storeId$});
                    }),
                    map(() => {
                        this.isLoading = false;
                    })
                ).subscribe();
            }
        }, 0);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Show flash message
     */
    showFlashMessage(type: 'success' | 'error'): void
    {
        // Show the message
        this.flashMessage = type;

        // Mark for check
        this._changeDetectorRef.markForCheck();

        // Hide it after 3 seconds
        setTimeout(() => {

            this.flashMessage = null;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, 3000);
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

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.templatesList.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.templatesList.forEach(row => this.selection.select(row));

        
    }

    deleteTemplates() {

        if (this.selection.selected.length > 0) {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Delete selected templates',
                message: 'Are you sure you want to delete templates? This action cannot be undone!',
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
                }
            });
        }

    }

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    createAddOn() {
        
        // Go to the new contact
        this._router.navigate(['./create' ], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}

