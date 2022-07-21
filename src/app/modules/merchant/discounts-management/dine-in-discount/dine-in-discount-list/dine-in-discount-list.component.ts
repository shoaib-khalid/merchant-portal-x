import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { MatDialog } from '@angular/material/dialog';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Days } from './dine-in-discount-list.types';
import { EditDineInDiscountDialogComponent } from '../edit-dine-in-discount/edit-dine-in-discount.component';


@Component({
    selector       : 'dine-in-discount-list.',
    templateUrl    : './dine-in-discount-list.component.html',
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
export class DineInDiscountListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    days: any[] = [];
    selectedDay: Days | null = null;
 
    flashMessage: 'success' | 'error' | null = null;
    isLoading: boolean = false;
    currentScreenSize: string[] = [];


    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
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
        this.days = [
            {
                id : '1',
                day: 'Monday',
                time : [{hour:'0'},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {
                id : '2',
                day: 'Tuesday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {
                id : '3',
                day: 'Wednesday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {   
                id : '4',
                day: 'Thursday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {
                id : '5',
                day: 'Friday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {
                id : '6',
                day: 'Saturday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
            {
                id : '7',
                day: 'Sunday',
                time : [{hour:0},{hour:1},{hour:2},{hour:3},{hour:4},{hour:5},{hour:6},{hour:7},{hour:8},{hour:9},{hour:10},{hour:11},{hour:12},{hour:13},{hour:14},{hour:15},{hour:16},{hour:17},{hour:18},{hour:19},{hour:20},{hour:21},{hour:22},{hour:23}]
            },
        ]

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

    /**
     * Toggle day details
     *
     * @param productId
     */
    toggleDetails(dayId?: string): void
    {
        // If the product is already selected...
        if ( this.selectedDay && this.selectedDay.id === dayId )
        {
            // Close the details
            this.closeDetails();
            return;
        }

        // Get the product by id
        // this._inventoryService.getProductById(productId)
        //     .subscribe((product) => {

        //         // Set the selected product
        //         this.selectedProduct = product;

        //         // Fill the form
        //         this.selectedProductForm.patchValue(product);

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });
    }

    /**
     * Close the details
     */
    closeDetails(): void
    {
        this.selectedDay = null;
    }

    openEditPopUp()    {
        const dialogRef = this._dialog.open(
            EditDineInDiscountDialogComponent, {
                    width: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                    height: this.currentScreenSize.includes('sm') ? 'auto' : '100%',
                    maxWidth: this.currentScreenSize.includes('sm') ? 'auto' : '100vw',  
                    maxHeight: this.currentScreenSize.includes('sm') ? 'auto' : '100vh',
                    disableClose: true,
                    // data:{ discountId:discountId }
                });

        dialogRef.afterClosed().subscribe(result => {
      
        });
    }

}
