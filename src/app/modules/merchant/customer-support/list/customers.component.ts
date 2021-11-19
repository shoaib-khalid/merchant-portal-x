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
import { Customer, CustomerVariant, CustomerVariantAvailable, CustomerInventory, CustomerCategory, CustomerPagination } from 'app/modules/merchant/customer-support/list/customers.types';
import { CustomersService } from 'app/modules/merchant/customer-support/list/customers.service';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'customers',
    templateUrl    : './customers.component.html',
    styles         : [
        /* language=SCSS */
        `
            .inventory-grid {
                grid-template-columns: 24px 230px auto 180px 180px;
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class CustomersComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('variantsPanel') private _variantsPanel: TemplateRef<any>;
    @ViewChild('variantsPanelOrigin') private _variantsPanelOrigin: ElementRef;

    // get current store
    store$: Store;

    // customer
    customers$: Observable<Customer[]>;
    selectedCustomer: Customer | null = null;
    selectedCustomerForm: FormGroup;
    
    pagination: CustomerPagination;

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
        private _customerService: CustomersService,
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
        // Create the selected customer form
        this.selectedCustomerForm = this._formBuilder.group({
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
    
        // Get the customers
        this.customers$ = this._customerService.customers$;
        
        // Get the pagination
        this._customerService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: CustomerPagination) => {

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
                    return this._customerService.getCustomers(0, 10, 'name', 'asc', query);
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

                // Get customers if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.closeDetails();
                        this.isLoading = true;
                        return this._customerService.getCustomers(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction);
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
     * Toggle customer details
     *
     * @param customerId
     */
    toggleDetails(customerId: string): void
    {
        // If the customer is already selected...
        if ( this.selectedCustomer && this.selectedCustomer.id === customerId )
        {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the customer by id
        this._customerService.getCustomerById(customerId)
            .subscribe((customer) => {

                // Set the selected customer
                this.selectedCustomer = customer;

                // Fill the form
                this.selectedCustomerForm.patchValue(customer);

                // Fill the form for SKU , Price & Quantity customerInventories[0]
                // this because SKU , Price & Quantity migh have variants
                // this is only for display, so we display the customerInventories[0] 
                this.selectedCustomerForm.get('sku').patchValue(customer.customerInventories[0].sku);
                this.selectedCustomerForm.get('price').patchValue(customer.customerInventories[0].price);
                this.selectedCustomerForm.get('quantity').patchValue(customer.customerInventories[0].quantity);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedCustomer = null;
    }

    /**
     * 
     *  DISCOUNTS
     * 
     */ 


    /**
     * Create customer
     */
    createCustomer(categoryId): void
    {

        // Create the customer
        this._customerService.createCustomer(categoryId).subscribe(async (newCustomer) => {
            
            // Go to new customer
            this.selectedCustomer = newCustomer["data"];

            // Update current form with new customer data
            this.selectedCustomerForm.patchValue(newCustomer["data"]);

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Update the selected customer using the form data
     */
    updateSelectedCustomer(): void
    {
        // Get
        // let storeFrontDomain = this._apiServer.settings.storeFrontDomain;
        let storeFrontDomain = 'symplified.ai';
        let storeFrontURL = 'https://' + this.store$.domain + '.' + storeFrontDomain;
        
        // Get the customer object
        const {sku, price, quantity, images, currentImageIndex, isVariants,
                customerAssets, customerDeliveryDetail, customerInventories, 
                customerReviews, customerVariants,  ...customer} = this.selectedCustomerForm.getRawValue();

        customer.seoName = customer.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
        customer.seoUrl = storeFrontURL + '/customer/name/' + customer.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');

        // Remove the currentImageIndex field
        // delete customerRaw.currentImageIndex;

        // Update the customer on the server
        this._customerService.updateCustomer(customer.id, customer).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        });

        // Update the inventory customer on the server (backend kena enable update)
        // this._customerService.updateInventoryToCustomer(customer.id, customerInventories).subscribe(() => {
        //     // Show a success message
        //     this.showFlashMessage('success');
        // });
    }

    /**
     * Delete the selected customer using the form data
     */
    deleteSelectedCustomer(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete customer',
            message: 'Are you sure you want to remove this customer? This action cannot be undone!',
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

                // Get the customer object
                const customer = this.selectedCustomerForm.getRawValue();

                // Delete the customer on the server
                this._customerService.deleteCustomer(customer.id).subscribe(() => {

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
