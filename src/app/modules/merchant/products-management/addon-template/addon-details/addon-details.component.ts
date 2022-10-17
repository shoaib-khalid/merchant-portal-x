import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDrawer, MatDrawerToggleResult } from '@angular/material/sidenav';
import { Router, ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { InventoryService } from 'app/core/product/inventory.service';
import { AddOnGroupTemplate } from 'app/core/product/inventory.types';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { AddOnListComponent } from '../addon-list/addon-list.component';

@Component({
    selector       : 'addon-details',
    templateUrl    : './addon-details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles         : [
        `
            .cdk-drag-preview {
                box-sizing: border-box;
                border-radius: 4px;
                box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                            0 8px 10px 1px rgba(0, 0, 0, 0.14),
                            0 3px 14px 2px rgba(0, 0, 0, 0.12);
            }

            .cdk-drag-placeholder {
                opacity: 0;
            }

            .cdk-drag-animating {
                transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
            }

            .list-class.cdk-drop-list-dragging .contain-class:not(.cdk-drag-placeholder) {
                transition: transform 150ms cubic-bezier(0, 0, 0.2, 1);
            }
        `
    ]
})
export class AddOnDetailsComponent implements OnInit, OnDestroy
{
    addOnForm: FormGroup;
    store$: Store;
    optionsData = [];
    storeVerticalCode: string = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentScreenSize: string[];
    selectedTemplate: AddOnGroupTemplate = null;
    /**
     * Constructor
     */
    constructor(
        public _drawer: MatDrawer,
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _addOnListComponent: AddOnListComponent,
        private _inventoryService: InventoryService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,

    )
    {
    }
    /**
     * Options getter
     */
    get options() {
        return this.addOnForm.controls["options"] as FormArray;
    }
    
    ngOnInit(): void {

        this.addOnForm = this._formBuilder.group({
            id     : [''],
            title  : ['',[Validators.required]],
            options: this._formBuilder.array([]),
        });


        this._inventoryService.addOnGroupTemplate$
        .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((template: AddOnGroupTemplate) => {

                if (template) {

                    this.selectedTemplate = template;

                    this.addOnForm.patchValue(template);
    
                    if (template.addOnTemplateItem && template.addOnTemplateItem.length > 0) {
                        template.addOnTemplateItem.forEach(ld => {
                            const optForm = this._formBuilder.group({
                                id          : new FormControl(ld.id),
                                name        : new FormControl(ld.name, Validators.required),
                                price       : new FormControl(ld.price, Validators.required),
                                dineInPrice : new FormControl(ld.dineInPrice, Validators.required)
                            });
                            this.options.push(optForm);
                        });
                    }
                    else {
                        const lform = this._formBuilder.group({
                            id          : [null],
                            name        : ['', Validators.required],
                            price       : [0, Validators.required],
                            dineInPrice : [0, Validators.required]
                        });
                        this.options.push(lform);
                
                    }
    
                }
                else {
                    const lform = this._formBuilder.group({
                        id          : [null],
                        name        : ['', Validators.required],
                        price       : [0, Validators.required],
                        dineInPrice : [0, Validators.required]
                    });
                    this.options.push(lform);
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Open the drawer
        this._addOnListComponent._drawer.open();
        
        // Get the stores
        this._storesService.store$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {

                // Update the pagination
                this.store$ = store;
                this.storeVerticalCode = this.store$.verticalCode;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               
    
                this.currentScreenSize = matchingAliases;                
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });   
        
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Set to null when destroy
        this._inventoryService.addOnGroupTemplate = null;
        
    }

    addOption() {
        const optionForm = this._formBuilder.group({
            id          : [null],
            name        : ['', Validators.required],
            price       : [0, Validators.required],
            dineInPrice : [0, Validators.required],
        });
        this.options.push(optionForm);
    }

    deleteOption(optionIndex: number) {

        let option = this.options.at(optionIndex).value;

        if (option.id) {
            this._inventoryService.deleteAddOnItemTemplate(option.id)
            .subscribe()
        }
        this.options.removeAt(optionIndex);
    }

    deleteTemplateGroup() {

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete Add-On Template',
            message: 'Are you sure you want to delete this add-on template? This action cannot be undone!',
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

                // Delete the product on the server
                this._inventoryService.deleteAddOnGroupTemplate(this.selectedTemplate.id).subscribe(() => {
                
                    setTimeout(() => {
                        // Go back to the list
                        this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
        
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                        
                    }, 300);

                });
            }
        });

        
    }

    /**
     * Move Form Array elements
     * @param event 
     */
    drop(event: CdkDragDrop<string[]>) {
        const option = this.addOnForm.controls["options"] as FormArray;
        const currentGroup = option.at(event.previousIndex);

        option.removeAt(event.previousIndex);
        option.insert(event.currentIndex, currentGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();

    }

    createTemplate() {

        const addOnGroupBody = {
            storeId : this.store$.id,
            title   : this.addOnForm.get('title').value
        }

        this._inventoryService.createAddOnGroupTemplate(addOnGroupBody)
            .pipe(
                switchMap((template: AddOnGroupTemplate) => {
                    let addOnItemBodies = this.options.value.map(item => {
                        return {
                            dineInPrice : item.dineInPrice,
                            name        : item.name,
                            price       : item.price,
                            groupId     : template.id
                        }
                    });
                    return this._inventoryService.createAddOnItemTemplateBulk(addOnItemBodies)
                })
            )
            .subscribe(resp => {

                setTimeout(() => {
                    // Go back to the list
                    this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                    
                }, 300);
        
            })


    }

    saveTemplate() {

        const addOnGroupBody = {
            storeId : this.store$.id,
            title   : this.addOnForm.get('title').value
        }

        this._inventoryService.updateAddOnGroupTemplate(this.addOnForm.get('id').value, addOnGroupBody)
            .pipe(
                switchMap((template: AddOnGroupTemplate) => {
                    let addOnItemBodies = this.options.value.map(item => {
                        return {
                            id          : item.id,
                            dineInPrice : item.dineInPrice,
                            name        : item.name,
                            price       : item.price,
                            groupId     : template.id
                        }
                    });
                    return this._inventoryService.createAddOnItemTemplateBulk(addOnItemBodies)
                })
            )
            .subscribe(resp => {

                setTimeout(() => {
                    // Go back to the list
                    this._router.navigate(['.'], {relativeTo: this._activatedRoute.parent});
    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                    
                }, 300);

        
            })

        
    }

    selectTotalAllowed(value: any, type: string) {
        
    }

    /**
     * Close the drawer- called by guard.ts
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._addOnListComponent._drawer.close();
    }
}
