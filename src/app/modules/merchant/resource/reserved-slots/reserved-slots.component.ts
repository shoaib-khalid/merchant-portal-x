import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { async, BehaviorSubject, merge, Observable, of, pipe, Subject } from 'rxjs';
import { debounceTime, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { OrdersListService } from 'app/modules/merchant/orders-management/orders-list/orders-list.service';
import { Order, OrdersCountSummary, OrdersListPagination } from 'app/modules/merchant/orders-management/orders-list/orders-list.types'
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderInvoiceComponent } from 'app/modules/merchant/orders-management/order-invoice/order-invoice.component';
import { ChooseProviderDateTimeComponent } from 'app/modules/merchant/orders-management/choose-provider-datetime/choose-provider-datetime.component';
import { Router } from '@angular/router';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { formatDate } from '@angular/common';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseConfirmationDialogComponent } from '@fuse/services/confirmation/dialog/dialog.component';
import { EditOrderComponent } from '../../orders-management/edit-order/edit-order.component';
import { OrderDetailsComponent } from '../../orders-management/order-details/order-details.component';
import { ResourceService } from 'app/core/resource/resource.service';
import { Resource, ResourceSlotReservationDetails } from 'app/core/resource/resource.types';
import { ApiResponseModel } from 'app/core/product/inventory.types';

@Component({
  selector: 'app.reserved-slots',
  templateUrl: './reserved-slots.component.html',
  styles: [
    `
        /* to truncate long text  */
        .truncate-cell {
            max-width: 150px; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* to break long words */
        .mat-cell-break-word {
            white-space: normal;
            word-wrap: break-word;
            max-width: 50px;
        }

        .cell-style {
            width: 130px
        }
        .cell-style-small {
            width: 90px
        }
        `
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservedSlotsComponent implements OnInit {


  listOfResourceSlotReservationDetails: any;

  columns: any;
  dataSource: ResourceSlotReservationDetails[];
  displayedColumns: string[] = ['customerName', 'customerEmail', 'customerPhoneNumber', 'date', 'startTime', 'endTime', 'durationInMinutes', 'customerNotes','status','actions'];

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  currentScreenSize: string[] = [];
  isLoading = true;

  /**
   * Constructor
   */
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _orderslistService: OrdersListService,
    private _storesService: StoresService,
    public _dialog: MatDialog,
    private _fuseConfirmationService: FuseConfirmationService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _router: Router,
    private _resourceService: ResourceService
  ) {
  }
  ngOnInit(): void {

    // Get the data
    this._resourceService.resourceSlotReservationDetails$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((data) => {

        // Store the table data
        this.dataSource = data;

        this.isLoading = false;

        // Mark for check
        this._changeDetectorRef.markForCheck();

      });

    this._fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({ matchingAliases }) => {

        this.currentScreenSize = matchingAliases;
        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

  }
  abc(value: any){
    console.log(value);
  }
  deleteDetails(resourceSlotReservationDetailsId): void {
		// Open the confirmation dialog
		const confirmation = this._fuseConfirmationService.open({
			title: 'Delete Slot Reservation',
			message: 'Are you sure you want to delete this reservation? This action cannot be undone!',
			actions: {
				confirm: {
					label: 'Delete'
				}
			}
		});

		// Subscribe to the confirmation dialog closed action
		confirmation.afterClosed().subscribe((result) => {

			// If the confirm button pressed...
			if (result === 'confirmed') {

				this._resourceService.deleteResourceSlotReservationDetails(resourceSlotReservationDetailsId).subscribe(() => {
				});
			}
		});
	}
}