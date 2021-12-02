import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { Customer, CustomerVariant, CustomerVariantAvailable, CustomerInventory, CustomerCategory, CustomerPagination } from 'app/modules/merchant/customer-support/list/customers.types';
import { Store } from 'app/core/store/store.types';
import { CreateAgentComponent } from '../create-agent/create-agent.component';
import { MatDialog } from '@angular/material/dialog';
import { ManageAgentService } from './manage-agent.service';
import { MatTableDataSource } from '@angular/material/table';
import { Agent, AgentPagination } from './manage-agent.types';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';


@Component({
  selector: 'manage-agent',
  templateUrl: './manage-agent.component.html',

  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations     : fuseAnimations
})
export class ManageAgentComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('selectFilter', {read: MatSelect})  _filter: MatSelect;

     // get current store
     store$: Store;
     completionStatuses: any = [];

     // agent
     agents$: Observable<Agent[]>;
     selectedAgent: Agent | null = null;
     selectedAgentForm: FormGroup;

     openTab: string = "HISTORY";
     displayStatuses: any = [];
     filterControl: FormControl = new FormControl();

     range: any;

     agentList: MatTableDataSource<any> = new MatTableDataSource();
     agentListTableColumns: string[] = ['username', 'type', 'details'];
 
     pagination: AgentPagination;
     flashMessage: 'success' | 'error' | null = null;
     isLoading: boolean = false;
     searchInputControl: FormControl = new FormControl();
     tabControl: FormControl = new FormControl();
 
     private _unsubscribeAll: Subject<any> = new Subject<any>();
    formFieldValue: any;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _manageAgentService: ManageAgentService,
    private _formBuilder: FormBuilder,
    public _dialog: MatDialog,
    private _router: Router,
    private _fuseConfirmationService: FuseConfirmationService,
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
                this.selectedAgentForm = this._formBuilder.group({
                    created: [''],
                    deactivated:  [''],
                    email:  [''],
                    id:  [''],
                    liveChatAgentId:  [''],
                    locked:  [''],
                    name:  [''],
                    roleId:  [''],
                    storeId:  [''],
                    updated:  [''],
                    username:  [''],
                });
 
         // Set initial active tab value
         this.tabControl.setValue("");
 
         // Get the data
         this._manageAgentService.agents$
             .pipe(takeUntil(this._unsubscribeAll))
             .subscribe((data) => {
 
                 // Store the table data
                 this.agentList.data = data;
 
                 // Mark for check
                 this._changeDetectorRef.markForCheck();
 
             });
 
         // Get the pagination
         this._manageAgentService.pagination$
             .pipe(takeUntil(this._unsubscribeAll))
             .subscribe((pagination: AgentPagination) => {
 
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
                 return this._manageAgentService.getAgent(0, 10, 'name', 'asc', query, '', '', '', this.tabControl.value);
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
                 return this._manageAgentService.getAgent(0, 10, 'name', 'asc', '', '', '', '', query);
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
                          return this._manageAgentService.getAgent(this._paginator.pageIndex, this._paginator.pageSize, this._sort.active, this._sort.direction, '' , '', '', '', this.tabControl.value);
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

    clearFilter(){
        this.filterControl.reset();
    }

    openSelector() {
        this._filter.open();
    }

    /**
     * Close the details
     */
     closeDetails(): void
     {
         this.selectedAgent = null;
     }

    /**
     * Create discount
     */
    createAgent(): void
    {
        const dialogRef = this._dialog.open(CreateAgentComponent, { disableClose: true });
        dialogRef.afterClosed().subscribe(result => {
            if (result.status === true) {
                // this will remove the item from the object
                const createAgentBody  = {
                    name: result.name,
                    username: result.username,
                    email: result.email,
                    password: result.password,
                    roleId : result.roleId,
                    storeId: this.storeId$
                };
        
                // Create the discount
                this._manageAgentService.createAgent(createAgentBody).subscribe(async (newAgent) => {
                    
                    // Go to new discount
                    this.selectedAgent = newAgent["data"];
    
                    // Update current form with new discount data
                    this.selectedAgentForm.patchValue(newAgent["data"]);
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
    }

    editAgent(agent) {

        console.log("agent",agent)

        const dialogRef = this._dialog.open(CreateAgentComponent, { disableClose: true, data: agent });
        dialogRef.afterClosed().subscribe(result => {
          
        });
    }

    /**
     * Delete the selected agent using the form data
     */
     deleteSelectedAgent(clientsId : string): void
    {
             // Open the confirmation dialog
             const confirmation = this._fuseConfirmationService.open({
                 title  : 'Delete agent',
                 message: 'Are you sure you want to remove this agent? This action cannot be undone!',
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
                this._manageAgentService.deleteAgent(clientsId).subscribe(() => {

                    // Close the details
                    this.closeDetails();
                });
            }
        });

    }
}
