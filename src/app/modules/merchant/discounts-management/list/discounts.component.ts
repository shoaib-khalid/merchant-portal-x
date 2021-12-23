import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/list/discounts.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/list/discounts.service';
import { CreateDiscountComponent } from '../create-discount/create-discount.component';
import { MatDialog } from '@angular/material/dialog';

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
                    grid-template-columns: 48px 112px auto 150px 96px;
                }

                @screen lg {
                    grid-template-columns: 48px 112px auto 180px 180px 180px 96px 72px;
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
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;

    // discount
    discounts$: Observable<Discount[]>;
    selectedDiscount: Discount | null = null;
    selectedDiscountForm: FormGroup;
    storeDiscountTierList: FormArray;
    storeDiscountTierListValueEditMode:any = [];

    pagination: DiscountPagination;

    // discount tier
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;
 

    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    searchInputControl: FormControl = new FormControl();

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    discountName: string;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _discountService: DiscountsService,
        public _dialog: MatDialog,
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
            discountName     : ['', [Validators.required]],
            startDate        : [''],
            endDate          : [''],
            startTime        : [''],
            endTime          : [''],
            discountType     : [''],
            isActive         : [''],
            maxDiscountAmount: [''],
            normalPriceItemOnly: [''],
            storeId          : [''], // not used
            storeDiscountTierList : this._formBuilder.array([]),
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
                    this.discountName = query;
                    return this._discountService.getDiscounts(0, 10, 'startDate', 'asc', query, '');
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
                    id          : 'startDate',
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
                        if (this.discountName != null)
                            return this._discountService.getDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.discountName, '');
                        else    
                            return this._discountService.getDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '', '');

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

                // clear discount tier form array
                (this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();

                // load discount tier form array with data frombackend
                discount.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                    this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(item));
                });
                
                this._discountService.getDiscountsTier(discountId)
                    .subscribe((response) => {

                    });

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
    createDiscount(): void
    {
        const dialogRef = this._dialog.open(CreateDiscountComponent, { disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
            if (result.status === true) {
                console.log("result", result)
                // this will remove the item from the object
                const createDiscountBody  = {
                    discountName: result.discountName,
                    discountType: result.discountOn,
                    startDate: result.startDate,
                    startTime: result.startTime,
                    endDate: result.endDate,
                    endTime: result.endTime,
                    isActive: result.isActive,
                    maxDiscountAmount: result.maxDiscountAmount,
                    normalPriceItemOnly: result.normalPriceItemOnly,
                    storeId: this.storeId$
                };
        
                // Create the discount
                this._discountService.createDiscount(createDiscountBody).subscribe(async (newDiscount) => {
                    
                    // Go to new discount
                    this.selectedDiscount = newDiscount["data"];
    
                    // Update current form with new discount data
                    this.selectedDiscountForm.patchValue(newDiscount["data"]);
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }, error => {
                    console.log(error);

                        if (error.status === 417) {
                            // Open the confirmation dialog
                            const confirmation = this._fuseConfirmationService.open({
                                title  : 'Discount date overlap',
                                message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                                actions: {
                                    confirm: {
                                        label: 'Ok'
                                    },
                                    cancel : {
                                        show : false,
                                    }
                                }
                            });
                        }

                });
            }
        });
    }

    /**
     * Update the selected discount using the form data
     */
    updateSelectedDiscount(): void
    {

        // Update the discount on the server
        this._discountService.updateDiscount(this.selectedDiscountForm.value.id, this.selectedDiscountForm.value).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Discount date overlap',
                        message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );
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

    insertTierToDiscount(){

        let discountTier: StoreDiscountTierList = {
            calculationType: this.calculationType,
            discountAmount: this.discountAmount,
            startTotalSalesAmount: this.startTotalSalesAmount,
        }

         // Create the discount
         this._discountService.createDiscountTier(this.selectedDiscount.id,discountTier).subscribe((response) => {
            
            this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;

            // since backend give full discount tier list .. (not the only one that have been created only)
            this.storeDiscountTierList.clear();

            response["data"].forEach(item => {
                this.storeDiscountTierList.push(this._formBuilder.group(item));
            });



            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Minimum subtotal overlap',
                        message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );
    }

    deleteSelectedDiscountTier(discountTierId: string): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete discount tier',
            message: 'Are you sure you want to remove this discount tier? This action cannot be undone!',
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

                // Delete the discount on the server
                this._discountService.deleteDiscountTier(this.selectedDiscount.id, discountTierId).subscribe(() => {
                    this.storeDiscountTierList = this.selectedDiscountForm.get('storeDiscountTierList') as FormArray;

                    let index = (this.storeDiscountTierList.value.findIndex(x => x.id === discountTierId));

                    // remove from discount tier list
                    if (index > -1) {
                        this.storeDiscountTierList.removeAt(index);
                    }

                    // console.log("this.storeDiscountTierList.value", this.storeDiscountTierList.value);
                    // this.storeDiscountTierList. patchValue(this.storeDiscountTierList.value);

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
    }


    updateSelectedDiscountTier(discountTier){

        // Update the discount on the server
        this._discountService.updateDiscountTier(discountTier.value.storeDiscountId, discountTier.value).subscribe(() => {
            // Show a success message
            this.showFlashMessage('success');
        }, error => {
            console.log(error);

                if (error.status === 417) {
                    // Open the confirmation dialog
                    const confirmation = this._fuseConfirmationService.open({
                        title  : 'Minimum subtotal overlap',
                        message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
                        actions: {
                            confirm: {
                                label: 'Ok'
                            },
                            cancel : {
                                show : false,
                            }
                        }
                    });
                }
            }
        );

    
    }
    
    validateDiscountTier(type, value){
        if (type === 'startTotalSalesAmount') {
            this.startTotalSalesAmount = value;
        }
        // if (type === 'endTotalSalesAmount') {
        //     this.endTotalSalesAmount = value;
        // }
        if (type === 'discountAmount') {
            this.discountAmount = value;
        }
        if (type === 'calculationType') {
            this.calculationType = value;
        }
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
