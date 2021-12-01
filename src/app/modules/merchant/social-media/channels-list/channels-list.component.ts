import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge,Observable ,Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { ChannelsListService } from 'app/modules/merchant/social-media/channels-list/channels-list.service';
import { ChannelsListPagination } from 'app/modules/merchant/social-media/channels-list/channels-list.types'
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { CreateChannelComponent } from '../create-channel/create-channel.component'; 
import { ChannelsList } from 'app/modules/merchant/social-media/channels-list/channels-list.types';


@Component({
    selector       : 'channels-list',
    templateUrl    : './channels-list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelsListComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('selectFilter', {read: MatSelect})  _filter: MatSelect;


    channels: any;
    openTab: string = "HISTORY";
    displayStatuses: any = [];
    completionStatuses: any = [];

    pagination: ChannelsListPagination;
    isLoading: boolean = false;
    filterControl: FormControl = new FormControl();
    tabControl: FormControl = new FormControl();
    filterList: string = "name";

    channels$: Observable<ChannelsList[]>;
    selectedChannel: ChannelsList | null = null;
    selectedChannelForm: FormGroup;


    range: any;

    channelsList: MatTableDataSource<any> = new MatTableDataSource();
    channelsListTableColumns: string[] = ['title', 'description', 'status', 'details'];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _channelslistService: ChannelsListService,
        public _dialog: MatDialog,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService
        )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.range = new FormGroup({
            start: new FormControl(),
            end: new FormControl(),
        });

        // Set initial active tab value
        this.tabControl.setValue("");

        // Get the data
        this._channelslistService.channels$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the table data
                this.channelsList.data = data;

                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        // Get the pagination
        this._channelslistService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: ChannelsListPagination) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // completion statuses from backend
        this.completionStatuses = [
            {
                id: "PAYMENT_CONFIRMED",
                label: "New",
                nextId: "BEING_PREPARED",
                nextLabel: "Process",
                nextLabelBtn: "Process",
            },
            {
                id: "RECEIVED_AT_STORE",
                label: "New",
                nextId: "BEING_PREPARED",
                nextLabel: "Process",
                nextLabelBtn: "Process",
            },
            {
                id: "BEING_PREPARED",
                label: "Process",
                nextId: "AWAITING_PICKUP",
                nextLabel: "Ready for Pickup",
                nextLabelBtn: "Ready",
            },
            {
                id: "AWAITING_PICKUP",
                label: "Ready for Pickup",
                nextId: "BEING_DELIVERED",
                nextLabel: "Sent",
                nextLabelBtn: "Sent",
            },
            {
                id: "BEING_DELIVERED",
                label: "Send",
                nextId: "DELIVERED_TO_CUSTOMER",
                nextLabel: "Received",
                nextLabelBtn: "Received",
            },
            {
                id: "DELIVERED_TO_CUSTOMER",
                label: "Delivered",
                nextId: null,
                nextLabel: null,
                nextLabelBtn: null,
            },
            {
                id: "HISTORY",
                label: "History",
                nextId: null,
                nextLabel: null,
                nextLabelBtn: null,
            }
        ];

        // display statuses is view at frontend
        this.displayStatuses = ["NEW","BEING_PREPARED","AWAITING_PICKUP","BEING_DELIVERED","DELIVERED_TO_CUSTOMER","HISTORY"];

        this.filterControl.valueChanges
        .pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300),
            switchMap((query) => {
                console.log("Query filter: ",query)
                this.isLoading = true;
                return this._channelslistService.getChannels(0, 10, 'name', 'asc', query, '', '', '', this.tabControl.value);
            }),
            map(() => {
                this.isLoading = false;
            })
        )
        .subscribe();

        this.tabControl.valueChanges
        .pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(300),
            switchMap((query) => {
                console.log("Query tab: ",query)
                this.isLoading = true;
                //kena ubah
                return this._channelslistService.getChannels(0, 10, 'name', 'asc', '', '', '', '', query);
            }),
            map(() => {
                this.isLoading = false;
            })
        )
        .subscribe();
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
                
                // If the user changes the sort channel...
                this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;                
                });
                
                // Get products if sort or page changes
                merge(this._sort.sortChange, this._paginator.page).pipe(
                    switchMap(() => {
                        this.isLoading = true;
                        return this._channelslistService.getChannels(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', this.tabControl.value);
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    toggleTabs(displayStatuses: string) {
        this.openTab = displayStatuses;

        let currentOpenTab = displayStatuses;
        if (displayStatuses === "HISTORY") {
            currentOpenTab = "";
        }

        if (displayStatuses === "NEW") {
            currentOpenTab = "PAYMENT_CONFIRMED";
        }

        this.tabControl.setValue(currentOpenTab);

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

     /**
     * Close the details
     */
      closeDetails(): void
      {
          this.selectedChannel = null;
      }

    clearFilter(){
        this.filterControl.reset();
    }

    openSelector() {
        this._filter.open();
    }

    updateStatus(channelId, nextCompletionStatus){
        this._channelslistService.updateChannel(channelId,nextCompletionStatus)
            .subscribe((response) => {
                console.log("OK");

                this._channelslistService.updateCompletion(channelId, nextCompletionStatus);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
            (response) => {
                console.log("NOT OK");
                // // Set the alert
                // this.alert = {
                //     type   : 'error',
                //     message: 'Something went wrong, please try again.'
                // };

                // // Show the alert
                // this.alert = true;
            });
    }

    getNextCompletionStatus(id){
        let index = this.completionStatuses.findIndex(item => item.id === id);

        if (index > -1){
            return this.completionStatuses[index];
        } else {
            return "Undefined";
        } 
    }

    viewDetails(channelId){
        console.log("channelId",channelId)
        this._router.navigateByUrl('social-media/channel-builder/'+channelId)
    }

    /**
     * Create channel
     */
     createChannel(): void
     {
         const dialogRef = this._dialog.open(CreateChannelComponent, { disableClose: true });
         dialogRef.afterClosed().subscribe(result => {
             console.log("result",result)
             if (result.status === true) {
                 // this will remove the item from the object
                 let createChannelBody  = {
                    id: result.id,
                    refId: result.refId,
                    userId: result.userId,
                    channelName: result.channelName,
                    token: result.token
                 };
         
                 // Create the discount
                 this._channelslistService.createChannel(createChannelBody).subscribe(async (newChannel) => {
                     
                     // Go to new discount
                     this.selectedChannel = newChannel["data"];
     
                     // Update current form with new discount data
                     this.selectedChannelForm.patchValue(newChannel["data"]);
     
                     // Mark for check
                     this._changeDetectorRef.markForCheck();
                 });
             }
         });
     }

    /**
     * Delete the selected channel
     */
     deleteSelectedChannel(channelId : string): void
     {
         console.log("deleteSelectedChannel",this.deleteSelectedChannel)
         // Open the confirmation dialog
         const confirmation = this._fuseConfirmationService.open({
             title  : 'Delete ',
             message: 'Are you sure you want to remove this channel? This action cannot be undone!',
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
                this._channelslistService.deleteChannel(channelId).subscribe(() => {

                    // Close the details
                    this.closeDetails();
                });
            }
        });
    }
}
