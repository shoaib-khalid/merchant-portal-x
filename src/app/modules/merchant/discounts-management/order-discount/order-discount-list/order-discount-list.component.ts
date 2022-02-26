import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiResponseModel, Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.types';
import { DiscountsService } from 'app/modules/merchant/discounts-management/order-discount/order-discount-list/order-discount-list.service';
import { CreateOrderDiscountDialogComponent } from '../create-order-discount/create-order-discount.component';
import { MatDialog } from '@angular/material/dialog';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { EditOrderDiscountDialogComponent } from '../edit-order-discount/edit-order-discount.component';


@Component({
    selector       : 'order-discount-list.',
    templateUrl    : './order-discount-list.component.html',
    styles         : [
        /* language=SCSS */
        `
            .order-discount-grid {
                grid-template-columns: 72px auto 40px;

                @screen sm {
                    grid-template-columns: 20px 112px auto 128px 72px;
                }

                @screen md {
                    grid-template-columns: 20px 112px auto 128px 72px;
                }

                @screen lg {
                    grid-template-columns: 20px 112px auto 128px 112px 112px 96px 72px;
                }

            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class OrderDiscountListComponent implements OnInit, AfterViewInit, OnDestroy
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

    currentScreenSize: string[] = [];

    changeStartTime:string;
    changeEndTime:string;

    isDisplayAddTier : boolean = false;


    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _formBuilder: FormBuilder,
        private _discountService: DiscountsService,
        public _dialog: MatDialog,
        private _fuseMediaWatcherService: FuseMediaWatcherService,

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
                    return this._discountService.getByQueryDiscounts(0, 10, 'startDate', 'asc', query, '','SHIPPING, TOTALSALES');
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

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
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, this.discountName, '','SHIPPING, TOTALSALES');

                        else    
                            return this._discountService.getByQueryDiscounts(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '','','SHIPPING, TOTALSALES');

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

    closeDetails(): void
    {
        this.selectedDiscount = null;
    }

    createDiscount(): void
    {   const dialogRef = this._dialog.open(
        CreateOrderDiscountDialogComponent, {
            width: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
            height: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
            maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
            maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
            disableClose: true,
            });
        
        dialogRef.afterClosed().subscribe();

        // dialogRef.afterClosed().subscribe(result => {
        //     if (result.status === true) {

        //         // this will remove the item from the object
        //         const createDiscountBody  = {
        //             discountName: result.discountName,
        //             discountType: result.discountOn,
        //             startDate: result.startDate,
        //             startTime: result.startTime,
        //             endDate: result.endDate,
        //             endTime: result.endTime,
        //             isActive: result.isActive,
        //             maxDiscountAmount: result.maxDiscountAmount,
        //             normalPriceItemOnly: result.normalPriceItemOnly,
        //             storeId: this.storeId$
        //         };
        
        //         // Create the discount
        //         this._discountService.createDiscount(createDiscountBody).subscribe(async (newDiscount) => {
                    
        //             // Go to new discount
        //             this.selectedDiscount = newDiscount["data"];
    
        //             // Update current form with new discount data
        //             this.selectedDiscountForm.patchValue(newDiscount["data"]);

        //             //set value of time with time selector
        //             this.setValueToTimeSelector(newDiscount["data"]);

        //             // clear discount tier form array
        //             (this.selectedDiscountForm.get('storeDiscountTierList') as FormArray).clear();
        //             //disabled button add tier
        //             this.isDisplayAddTier = false;
    
        //             // Mark for check
        //             this._changeDetectorRef.markForCheck();

        //         }, (error) => {
        //             console.error(error);
        //             if (error.status === 417) {
        //                 // Open the confirmation dialog
        //                 const confirmation = this._fuseConfirmationService.open({
        //                     title  : 'Discount date overlap',
        //                     message: 'Your discount date range entered overlapping with existing discount date! Please change your date range',
        //                     actions: {
        //                         confirm: {
        //                             label: 'Ok'
        //                         },
        //                         cancel : {
        //                             show : false,
        //                         }
        //                     }
        //                 });
        //             }
        //         });
        //     }
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


    setValueToTimeSelector(discount){

        //=====================START TIME =====================
        let _pickStartTimeHour = discount.startTime.split(":")[0];
        let _pickStartTimeMinute = discount.startTime.split(":")[1];

        let _pickStartTimeAMPM : 'AM' | 'PM';
        if ((<any>_pickStartTimeHour) > 12) {
            _pickStartTimeAMPM = "PM";
            (<any>_pickStartTimeHour) = (<any>_pickStartTimeHour) - 12;
            (<any>_pickStartTimeHour) = (((<any>_pickStartTimeHour) < 10) ? '0' : '') + _pickStartTimeHour;    

        } else {
            _pickStartTimeAMPM = "AM";
        }
        
        this.selectedDiscountForm.get('startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));
        
        //=====================/ START TIME =====================

        //=====================END TIME =====================

        let _pickEndTimeHour = discount.endTime.split(":")[0];
        let _pickEndTimeMinute = discount.endTime.split(":")[1];

        let _pickEndTimeAMPM : 'AM' | 'PM';
        if (<any>_pickEndTimeHour > 12) {
            _pickEndTimeAMPM = "PM";
            (<any>_pickEndTimeHour) = (<any>_pickEndTimeHour) - 12;
            (<any>_pickEndTimeHour) = (((<any>_pickEndTimeHour) < 10) ? '0' : '') + _pickEndTimeHour;    

        } else {
            _pickEndTimeAMPM = "AM";
        }
        
        this.selectedDiscountForm.get('endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));
        //===================== / END TIME =====================
        return;
    }

    openEditPopUp(discountId?:string)    {
        const dialogRef = this._dialog.open(
            EditOrderDiscountDialogComponent, {
                width: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                height: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                disableClose: true,
                data:{ discountId:discountId }
                });

        dialogRef.afterClosed().subscribe(result => {
      
        });
    }

}
