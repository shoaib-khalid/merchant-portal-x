import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Discount, DiscountVariant, DiscountVariantAvailable, DiscountInventory, DiscountCategory, DiscountPagination } from 'app/modules/merchant/discounts-management/list/discounts.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/list/discounts.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'discounts',
    templateUrl    : './discounts.component.html',
    styles         : [
        /* language=SCSS */
        `
            .inventory-grid {
                grid-template-columns: 48px 112px auto 40px;

                @screen sm {
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 112px auto 150px 150px 96px;
                }

                @screen lg {
                    grid-template-columns: 48px 112px auto 180px 180px 96px 72px;
                }
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class DiscountsComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;

    // get current store
    store$: Store;

    // discount
    discounts$: Observable<Discount[]>;
    selectedDiscount: Discount | null = null;
    selectedDiscountForm: FormGroup;
    
    pagination: DiscountPagination;

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _discountService: DiscountsService,
        private _storesService: StoresService
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
        // Create the selected discount form
        this.selectedDiscountForm = this._formBuilder.group({
            id               : [''],
            name             : ['', [Validators.required]],
            description      : [''],
            storeId          : [''], // not used
            categoryId       : [''],
            status           : ['INACTIVE'],
            thumbnailUrl     : ['']
        });

        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    
        // Get the discounts
        this.discounts$ = this._discountService.discounts$;
        
        // Get the pagination
        this._discountService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: DiscountPagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        
        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.closeDetails();
                    this.isLoading = true;
                    return this._discountService.getDiscounts(0, 10, 'name', 'asc', query);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

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
                // Set the initial sort
                this._sort.sort({
                    id          : 'name',
                    start       : 'asc',
                    disableClear: true
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();

                // If the user changes the sort order...
                this._sort.sortChange
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe(() => {
                        // Reset back to the first page
                        this._paginator.pageIndex = 0;

                        // Close the details
                        this.closeDetails();
                    });

                // Get discounts if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._discountService.getDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
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
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle discount details
     *
     * @param discountId
     */
    toggleDetails(discountId: string): void
    {
        // If the discount is already selected...
        if ( this.selectedDiscount && this.selectedDiscount.id === discountId )
        {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the discount by id
        this._discountService.getDiscountById(discountId)
            .subscribe((discount) => {

                // Set the selected discount
                this.selectedDiscount = discount;

                // Fill the form
                this.selectedDiscountForm.patchValue(discount);

                // Fill the form for SKU , Price & Quantity discountInventories[0]
                // this because SKU , Price & Quantity migh have variants
                // this is only for display, so we display the discountInventories[0] 
                this.selectedDiscountForm.get('sku').patchValue(discount.discountInventories[0].sku);
                this.selectedDiscountForm.get('price').patchValue(discount.discountInventories[0].price);
                this.selectedDiscountForm.get('quantity').patchValue(discount.discountInventories[0].quantity);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedDiscount = null;
    }

    /**
     * 
     *  DISCOUNTS
     * 
     */ 


    /**
     * Create discount
     */
    createDiscount(categoryId): void
    {

        // Create the discount
        this._discountService.createDiscount(categoryId).subscribe(async (newDiscount) => {
            
            // Go to new discount
            this.selectedDiscount = newDiscount["data"];

            // Update current form with new discount data
            this.selectedDiscountForm.patchValue(newDiscount["data"]);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected discount using the form data
     */
    updateSelectedDiscount(): void
    {
        // Get
        // let storeFrontDomain = this._apiServer.settings.storeFrontDomain;
        let storeFrontDomain = 'symplified.ai';
        let storeFrontURL = 'https://' + this.store$.domain + '.' + storeFrontDomain;
        
        // Get the discount object
        const {sku, price, quantity, images, currentImageIndex, isVariants,
                discountAssets, discountDeliveryDetail, discountInventories, 
                discountReviews, discountVariants,  ...discount} = this.selectedDiscountForm.getRawValue();

        discount.seoName = discount.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        discount.seoUrl = storeFrontURL + '/discount/name/' + discount.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');

        // Remove the currentImageIndex field
        // delete discountRaw.currentImageIndex;

        // Update the discount on the server
        this._discountService.updateDiscount(discount.id, discount).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        });

        // Update the inventory discount on the server (backend kena enable update)
        // this._discountService.updateInventoryToDiscount(discount.id, discountInventories).subscribe(() => {
        //     // Show a success message
        //     this.showFlashMessage('success');
        // });
    }

    /**
     * Delete the selected discount using the form data
     */
    deleteSelectedDiscount(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount',
            message: 'Are you sure you want to remove this discount? This action cannot be undone!',
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

                // Get the discount object
                const discount = this.selectedDiscountForm.getRawValue();

                // Delete the discount on the server
                this._discountService.deleteDiscount(discount.id).subscribe(() => {

                    // Close the details
                    this.closeDetails();
                });
            }
        });
    }

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

            let aProp = a[property] ? a[property] : '';
            let bProp = b[property] ? b[property] : '';

            var result = ( aProp.toLowerCase() < bProp.toLowerCase()) ? -1 : (aProp.toLowerCase() > bProp.toLowerCase()) ? 1 : 0;
            return (result * sortOrder);
        }
    }

}
