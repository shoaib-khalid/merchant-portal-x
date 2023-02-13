import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LocationService } from 'app/core/location-service/location.service';
import { TagDetails, TagTable, ZoneTable } from 'app/core/location-service/location.types';
import { ZoneDetailsModalComponent } from './modal-zone-details/modal-zone-details.component';
import { MatDialog } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

interface DialogResponse
{
    saved: boolean;
    value: {
        zoneName     : string;
        prefix       : string,   
        tableNoStart : number,
        tableNoEnd   : number
    }
}

/**
 *  CREATE = 'create',
    EDIT_ZONE = 'edit_zone',
    EDIT_TABLE = 'edit_table',
    ADD_TABLE = 'add_table'
 */
export const enum ModalTypes {
    CREATE = 'create',
    EDIT_ZONE = 'edit_zone',
    EDIT_TABLE = 'edit_table',
    ADD_TABLE = 'add_table'
}

@Component({
    selector       : 'store-dine-in',
    templateUrl    : './store-dine-in.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreDineInComponent implements OnInit
{
    storeDineInForm: UntypedFormGroup;
    
    store: Store;
    storeId: string;
    storeName: string;

    /** Domain details */
    fullDomain: string;
    domainName:string;
    subDomainName: string;
    
    // dialingCode
    dialingCode: string;

    // Fuse Media Watcher
    currentScreenSize: string[] = [];

    /** Quil Modules */
    quillModules: any = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{align: []}, {list: 'ordered'}, {list: 'bullet'}],
            [{link: function(value) {
                    if (value) {
                      var href = prompt('Enter the URL');
                      this.quill.format('link', href);
                    } else {
                      this.quill.format('link', false);
                    }
                  }
            }],
            ['blockquote','clean']
        ]
    };

    // Zone and Table
    tabs : {
        id?: number,
        tagId: number,
        zoneName: string,
        tagTables: TagTable[],
        edited?: boolean
    }[] = [];
    selected = new UntypedFormControl(0);
    tabForm: UntypedFormGroup;

    tagDetails: TagDetails = null;
    zonesToBeDeleted = [];
    tablesToBeDeleted = [];
    tablesToBeCreated = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        public _dialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _route: ActivatedRoute,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _locationService: LocationService

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
        // Create the form
        this.storeDineInForm = this._formBuilder.group({
            dineInPaymentType   : ['COD', Validators.required],
            dineInOption        : ['SELFCOLLECT'], //SELFCOLLECT, SENDTOTABLE
            isDineIn            : [false],
            dineInConsolidatedOrder: [false]
        });

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        this._storesService.getStoreById(this.storeId)
            .subscribe((storeResponse: Store) => {

                this.store = storeResponse;

                // set store to current store
                this._storesService.store = storeResponse;
                this._storesService.storeId = this.storeId;

                this.storeDineInForm.patchValue(storeResponse)

                // set default dineInOption to SELFCOLLECT
                if (this.storeDineInForm.get('isDineIn').value === false) {
                    this.storeDineInForm.get('dineInOption').setValue('SELFCOLLECT');
                }
 
                // Mark for check
                this._changeDetectorRef.markForCheck();

            });

        this._locationService.getTagDetails(this.storeId)
            .subscribe({
                next: (tagDetails: TagDetails[]) => {
                    this.tagDetails = tagDetails[0]; 

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: (err) => {
                    console.error('ERROR')
                }

            })

        this._locationService.getTables(this.storeId)
            .subscribe({
                next: (tables: ZoneTable[]) => {

                    if (tables && tables.length > 0)
                    {
                        // Only set zone with tables
                        this.tabs = tables.reduce((accumulator, currentValue) => {
                            if (currentValue.tagTables.length > 0) {
                              return [...accumulator, currentValue];
                            }
                            return accumulator;
                          }, []);
                    }

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: (err) => {
                    console.error('ERROR')
                }

            })
        
        // Fuse Media Watcher Service
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

    addTab() {

        const dialogRef = this._dialog.open( 
            ZoneDetailsModalComponent, {
                width: '580px',
                maxWidth: '100vw',
                data: {
                    toCreate: ModalTypes.CREATE,
                    zones: this.tabs.map(z => z.zoneName)
                },
                disableClose: true
            });
            
        dialogRef.afterClosed().subscribe((result: DialogResponse) => 
            {

                if (result.saved) {
                    
                    const zoneResp = result.value;
                    const totalTables = zoneResp.tableNoEnd - zoneResp.tableNoStart + 1;
                    const tagTablesBodyArr  = [];

                    for (let index = 0; index < totalTables; index++) {
                        tagTablesBodyArr.push({
                            combinationTableNumber: `${zoneResp.prefix}${zoneResp.tableNoStart + index}`,
                            tableNumber: zoneResp.tableNoStart + index,
                            tablePrefix: zoneResp.prefix
                        })
                    }
                        
                    this.tabs.push({
                        tagId: this.tagDetails.tagId,
                        zoneName: zoneResp.zoneName,
                        tagTables: tagTablesBodyArr
                    });    
                    
                    // Select tab after adding
                    this.selected.setValue(this.tabs.length - 1);

                    // To enable save button
                    this.storeDineInForm.markAsDirty();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            }
        )
    }

    removeTab(index: number, zoneName: string) {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : `Delete Zone '${zoneName}'`,
            message: 'Are you sure you want to delete this zone?',
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
                if (this.tabs[index] && this.tabs[index].id) {
                    this.zonesToBeDeleted.push(this.tabs[index].id)                    
                } 
                this.tabs.splice(index, 1);

                // To enable save button
                this.storeDineInForm.markAsDirty();

                // Mark for check
                this._changeDetectorRef.markForCheck();

            }
        });       
    }

    deleteTable(zoneIndex: number, tableIndex: number, tableName: string) {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : `Delete Table '${tableName}'`,
            message: 'Are you sure you want to delete this table?',
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
                if (this.tabs[zoneIndex] && this.tabs[zoneIndex].tagTables[tableIndex].id) {
                    this.tablesToBeDeleted.push(this.tabs[zoneIndex].tagTables[tableIndex].id)                    
                } 
                this.tabs[zoneIndex].tagTables.splice(tableIndex, 1);

                if (this.tablesToBeCreated.length > 0) {
                    let index = this.tablesToBeCreated.findIndex(table => table.combinationTableNumber == tableName);

                    if (index > -1) {
                        this.tablesToBeCreated.splice(index, 1);
                    }
                }

                // To enable save button
                this.storeDineInForm.markAsDirty();

                // Mark for check
                this._changeDetectorRef.markForCheck();

            }
        });       
    }

    editZoneName(zoneName: string) {

        const dialogRef = this._dialog.open( 
            ZoneDetailsModalComponent, {
                width: '580px',
                maxWidth: '100vw',
                data: {
                    toCreate: ModalTypes.EDIT_ZONE,
                    zones: this.tabs.map(z => z.zoneName),
                    currentZoneName: zoneName
                },
                disableClose: true
            });

        dialogRef.afterClosed().subscribe((result: DialogResponse) => 
            {

                if (result.saved) {
                    
                    const zoneResp = result.value;
                    const index = this.tabs.findIndex(x => x.zoneName === zoneName);

                    if (index > -1) {
                        this.tabs[index].zoneName = zoneResp.zoneName;
                        this.tabs[index].edited = true;
                    }

                    // To enable save button
                    this.storeDineInForm.markAsDirty();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            }
        )
    }

    editTableNo(zone: ZoneTable, tableNo: string, tableIndex: number) {

        const dialogRef = this._dialog.open( 
            ZoneDetailsModalComponent, {
                width: '580px',
                maxWidth: '100vw',
                data: {
                    toCreate: ModalTypes.EDIT_TABLE,
                    currentZone: zone,
                    currentTableNo: tableNo
                },
                disableClose: true
            });

        dialogRef.afterClosed().subscribe((result: DialogResponse) => 
            {

                if (result.saved) {
                    
                    const zoneResp = result.value;
                    const index = this.tabs.findIndex(x => x.zoneName === zone.zoneName);
                    
                    if (index > -1) {
                        this.tabs[index].tagTables[tableIndex].tablePrefix = zoneResp.prefix;
                        this.tabs[index].tagTables[tableIndex].tableNumber = zoneResp.tableNoStart.toString();
                        this.tabs[index].tagTables[tableIndex].combinationTableNumber = `${zoneResp.prefix}${zoneResp.tableNoStart}`;
                        this.tabs[index].tagTables[tableIndex].edited = true;
                    }

                    // To enable save button
                    this.storeDineInForm.markAsDirty();
                    

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            }
        )
    }

    addTableNo(zone: ZoneTable, zoneIndex: number) {

        const dialogRef = this._dialog.open( 
            ZoneDetailsModalComponent, {
                width: '580px',
                maxWidth: '100vw',
                data: {
                    toCreate: ModalTypes.ADD_TABLE,
                    currentZone: zone
                },
                disableClose: true
            });

        dialogRef.afterClosed().subscribe((result: DialogResponse) => 
            {

                if (result.saved) {
                    
                    const zoneResp = result.value;

                    const tableBody = {
                        combinationTableNumber: `${zoneResp.prefix}${zoneResp.tableNoStart}`,
                        tableNumber: zoneResp.tableNoStart + '',
                        tablePrefix: zoneResp.prefix,
                        zoneId: zone.id
                    }

                    this.tabs[zoneIndex].tagTables.push(tableBody);

                    this.tablesToBeCreated.push(tableBody);
    
                    // To enable save button
                    this.storeDineInForm.markAsDirty();
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            }
        )

    }

    update(){

        // this will remove the item from the object
        const storeDineIn = this.storeDineInForm.value;
        
        this._storesService.update(this.storeId, storeDineIn)
        .subscribe((response) => {

            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Success',
                message: 'Your store account has been updated successfully!',
                icon: {
                    show: true,
                    name: "heroicons_outline:check",
                    color: "success"
                },
                actions: {
                    confirm: {
                        label: 'OK',
                        color: "primary",
                    },
                    cancel: {
                        show: false,
                    },
                }
            });

        });

        this.tabs.forEach((tab, index) => {

            // If has id and edited, call PUT zone
            if (tab.id) {
                if (tab.edited === true) {
                    this._locationService.putZone(tab.id, { zoneName: tab.zoneName, tagId: this.tagDetails.tagId }).subscribe()
                }

                tab.tagTables.forEach(t => {
                    if (t.edited && t.id) {
                        const body: TagTable = {
                            combinationTableNumber: t.combinationTableNumber,
                            tablePrefix: t.tablePrefix,
                            zoneId: t.zoneId,
                            tableNumber: t.tableNumber,
                            id: t.id
                        }
                        this._locationService.putTable(t.id, body).subscribe()
                    }
                })
                
            }
            // If no id, create the zone
            else if (!tab.id) {
                const zoneBody = {
                    zoneName: tab.zoneName,
                    tagId: this.tagDetails.tagId
                }
    
                const tablesBody = tab.tagTables;
    
                this._locationService.postTableZone(zoneBody)
                    .pipe(
                        switchMap(resp => {

                            const index = this.tabs.findIndex(x => x.zoneName === resp.zoneName);
                            if (index > -1) {
                                // Set id to the tab, this is to allow the tab to be edited without leaving the page
                                this.tabs[index]['id'] = resp.id;
                            }

                            // Set zoneId to the tables before post
                            tablesBody.forEach(table => table['zoneId'] = resp.id)
                            return this._locationService.postTablesBulk(tablesBody)
                        })
                    )
                    .subscribe()
            }
        })

        // Delete zones
        this.zonesToBeDeleted.forEach((id, idx, arr) => {
            this._locationService.deleteZone(id).subscribe();

            // Only set to empty on the last iteration
            if (idx === arr.length - 1){ 
                this.zonesToBeDeleted = []; 
            }
        })

        // Delete tables
        this.tablesToBeDeleted.forEach((id, idx, arr) => {
            this._locationService.deleteTable(id).subscribe();

            // Only set to empty on the last iteration
            if (idx === arr.length - 1){ 
                this.tablesToBeDeleted = []; 
            }
        })

        // Create new tables
        if (this.tablesToBeCreated.length > 0) {
            this._locationService.postTablesBulk(this.tablesToBeCreated).subscribe()
        }

        // Enable the form
        // this.storeDineInForm.enable();
    }

}
