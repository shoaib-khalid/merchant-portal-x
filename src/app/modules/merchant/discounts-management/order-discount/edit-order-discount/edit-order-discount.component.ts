import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { Subject } from 'rxjs';
import { DiscountsService } from '../order-discount-list/order-discount-list.service';
import { ApiResponseModel, Discount, StoreDiscountTierList } from '../order-discount-list/order-discount-list.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';

@Component({
    selector: 'app-edit-order-discount',
    templateUrl: './edit-order-discount.component.html',
    styles    :   [`
        /** language=SCSS */
        :host ::ng-deep .mat-horizontal-content-container {
            // max-height: 90vh;
            padding: 0 0px 20px 0px;
            // overflow-y: auto;
        }
        :host ::ng-deep .mat-horizontal-stepper-header-container {
            height: 60px;
        }
        :host ::ng-deep .mat-horizontal-stepper-header {
            height: 60px;
            padding-left: 8px;
            padding-right: 8px;
        }
        .content{
            height:400px;
        }

        .edit-order-discount-grid {
            grid-template-columns: 80px 80px auto 80px;

            @screen sm {
                grid-template-columns: 20px 120px 120px auto 80px;
            }
        }
    `]
})
export class EditOrderDiscountDialogComponent implements OnInit {

    // get current store
    store$: Store;
    
    horizontalStepperForm: FormGroup;
    discountId:string;
    selectedDiscount: Discount | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    loadDetails:boolean=false;
    storeDiscountTierList: FormArray;

    storeDiscountTierListValueEditMode:any = [];

    // discount tier for insert mode
    calculationType: string;
    discountAmount: number;
    // endTotalSalesAmount: number;
    startTotalSalesAmount: number;

    //disable add tier button 
    isDisplayAddTier : boolean = false;

    flashMessage: 'success' | 'error' | null = null;

    changeStartTime:string;
    changeEndTime:string;

    currentScreenSize: string[] = [];

    isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EditOrderDiscountDialogComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _discountService: DiscountsService,
    private _fuseConfirmationService: FuseConfirmationService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _storesService: StoresService,
    // private createOrderDiscount:CreateOrderDiscount,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

  ngOnInit(): void {

    //get value when open matdialot
    this.discountId = this.data['discountId'];
    
    // Horizontal stepper form
    this.horizontalStepperForm = this._formBuilder.group({
        //Main Discount
        step1: this._formBuilder.group({
            id                  : [''],
            discountName        : [''],
            discountType        : [''],
            startDate           : [''],
            endDate             : [''],
            startTime           : [new TimeSelector("--","--","--")],
            endTime             : [new TimeSelector("--","--","--")],
            isActive            : [''],
            maxDiscountAmount   : [''],
            normalPriceItemOnly : [''],
            storeId             : [''], // not used
     
        }),
        //Tier List
        step2: this._formBuilder.array([]),
    });

    // if id is exist so it is edit mode, Get the discount by id
    // if(this.discountId){
        this._discountService.getDiscountByGuid(this.discountId)
            .subscribe((response:ApiResponseModel<Discount>) => {

                //Set the selected discount
                this.selectedDiscount = response.data;

                const { startTime, endTime, ...selectedDiscount } = this.selectedDiscount;
    
                // Fill the form step 1
                this.horizontalStepperForm.get('step1').patchValue(selectedDiscount);

                //set value for time in tieme selector
                this.setValueToTimeSelector(response.data);

                //after we set the form with custom field time selector then we display the details form
                this.loadDetails =true;

                // clear discount tier form array
                (this.horizontalStepperForm.get('step2') as FormArray).clear();
                
                // load discount tier form array with data frombackend
                response.data.storeDiscountTierList.forEach((item: StoreDiscountTierList) => {
                    this.storeDiscountTierList = this.horizontalStepperForm.get('step2') as FormArray;
                    this.storeDiscountTierList.push(this._formBuilder.group(item));
                });
                
                
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    // }
    // //for create mode
    // else{
    //     this.loadDetails =true;
    // }

    // Get the store
    this._storesService.store$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((store: Store) => {

            // Update the store
            this.store$ = store;

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

  cancel(){
    this.dialogRef.close();
  }

  updateSelectedDiscount(): void
  {
      // Set loading to true
      this.isLoading = true;

      this.changeTime();
      let sendPayload = [this.horizontalStepperForm.get('step1').value];
      let toBeSendPayload=sendPayload.
      map((x)=>(
          {
              startTime:this.changeStartTime,
              endTime:this.changeEndTime,
              discountName: x.discountName,
              discountType:x.discountType,
              endDate: x.endDate,
              id: x.id,
              isActive: x.isActive,
              maxDiscountAmount: x.maxDiscountAmount,
              normalPriceItemOnly: x.normalPriceItemOnly,
              startDate: x.startDate,
              storeDiscountTierList: this.horizontalStepperForm.get('step2').value,
              storeId: x.storeId,
          }
          ));

      // Update the discount on the server
      this._discountService.updateDiscount(this.discountId, toBeSendPayload[0])
          .subscribe((resp) => {
            // Set loading to false
            this.isLoading = false;

            // Show a success message
            this.showFlashMessage('success');

          },((error) => {
              // Set loading to false
                this.isLoading = false;

                console.error(error);

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
                // Show a success message
                this.showFlashMessage('error');
            }
          ));

        // Set delay before closing the details window
        setTimeout(() => {

            // close the window
            this.cancel();

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, 1000);
  }

  checkButton(){
    console.info('this.horizontalStepperForm ',this.horizontalStepperForm.value);
    console.info('form array',this.horizontalStepperForm.get('step2')['controls']);
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

    this.horizontalStepperForm.get('step1.startTime').setValue(new TimeSelector(_pickStartTimeHour,_pickStartTimeMinute, _pickStartTimeAMPM));

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
    
    this.horizontalStepperForm.get('step1.endTime').setValue(new TimeSelector(_pickEndTimeHour,_pickEndTimeMinute, _pickEndTimeAMPM));

    //===================== / END TIME =====================
    return;
  }

  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }

  insertTierToDiscount(){

    // check condition first before pass to backend
    if(this.calculationType === 'PERCENT' && this.discountAmount>100){

        const confirmation = this._fuseConfirmationService.open({
            title  : 'Exceed maximum amount discount percentage',
            message: 'Please change your discount amount for percentage calculation type',
            actions: {
                confirm: {
                    label: 'Ok'
                },
                cancel : {
                    show : false,
                }
            }
        });

        return;
    }

    let discountTier: StoreDiscountTierList = {
        calculationType: this.calculationType,
        discountAmount: this.discountAmount,
        startTotalSalesAmount: this.startTotalSalesAmount,
    }

    // Create the discount
    this._discountService.createDiscountTier(this.selectedDiscount.id,discountTier)
        .subscribe((response) => {
            
            this.storeDiscountTierList = this.horizontalStepperForm.get('step2') as FormArray;

            // since backend give full discount tier list .. (not the only one that have been created only)
            this.storeDiscountTierList.clear();

            response["data"].forEach(item => {
                this.storeDiscountTierList.push(this._formBuilder.group(item));
            });

            //disable button add
            this.isDisplayAddTier=false;
            //clear the input
            (<any>this.startTotalSalesAmount)='';
            (<any>this.discountAmount)='';
            this.calculationType='';

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }, (error) => {
            console.error(error);
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
        });
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
                  
                  this.storeDiscountTierList = this.horizontalStepperForm.get('step2') as FormArray;

                  let index = (this.storeDiscountTierList.value.findIndex(x => x.id === discountTierId));

                  // remove from discount tier list
                  if (index > -1) {
                      this.storeDiscountTierList.removeAt(index);
                  }

                  // Mark for check
                  this._changeDetectorRef.markForCheck();
              });
          }
      });
  }


  updateSelectedDiscountTier(discountTier){

      // check condition first before pass to backend

      if(discountTier.value.calculationType === 'PERCENT' && discountTier.value.discountAmount>100){

          const confirmation = this._fuseConfirmationService.open({
              title  : 'Exceed maximum amount discount percentage',
              message: 'Please change your discount amount for percentage calculation type',
              actions: {
                  confirm: {
                      label: 'Ok'
                  },
                  cancel : {
                      show : false,
                  }
              }
          });
          this.storeDiscountTierListValueEditMode = [true];

          return;
      }

      // Update the discount on the server
      this._discountService.updateDiscountTier(discountTier.value.storeDiscountId, discountTier.value).subscribe(() => {
          // Show a success message
          this.showFlashMessage('success');
      }, error => {
          console.error(error);
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
      });
  }

  validateDiscountTier(type:string, value){
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

    if(<any>this.startTotalSalesAmount === "" || <any>this.discountAmount === "" ){
        this.isDisplayAddTier = false;
    }
    else if(this.startTotalSalesAmount !== undefined && this.discountAmount!==undefined && this.calculationType!==undefined){
        this.isDisplayAddTier = true;
    }

  }

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

  changeTime(){
    //===========Start Time==================
    let pickStartTime =this.horizontalStepperForm.get('step1.startTime').value;
    let _pickStartTime;

    if ((<any>pickStartTime).timeAmPm === "PM") {
        _pickStartTime = parseInt((<any>pickStartTime).timeHour) + 12;
    } else {
        _pickStartTime = (<any>pickStartTime).timeHour;
    }
    const changePickStartTime = new Date();
    changePickStartTime.setHours(_pickStartTime,(<any>pickStartTime).timeMinute,0);
    
    this.changeStartTime= String(changePickStartTime.getHours()).padStart(2, "0")+':'+String(changePickStartTime.getMinutes()).padStart(2, "0");    
    
    //==============End time===================
    let pickEndTime = this.horizontalStepperForm.get('step1.endTime').value;
    let _pickEndTime;

    if ((<any>pickEndTime).timeAmPm === "PM") {
        _pickEndTime = parseInt((<any>pickEndTime).timeHour) + 12;
    } else {
        _pickEndTime = (<any>pickEndTime).timeHour;
    }
    const changePickEndTime = new Date();
    changePickEndTime.setHours(_pickEndTime,(<any>pickEndTime).timeMinute,0);
    
    this.changeEndTime= String(changePickEndTime.getHours()).padStart(2, "0")+':'+String(changePickEndTime.getMinutes()).padStart(2, "0");  
    
    return;
  
  }

  createButton(){
    // this.createOrderDiscount.displayMessage();
  }

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
              const discount = this.horizontalStepperForm.get('step1').value;

              // Delete the discount on the server
              this._discountService.deleteDiscount(discount.id).subscribe(() => {

                // Set delay before closing the details window
                setTimeout(() => {

                    // close the window
                    this.cancel();

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }, 1000);
              });
          }
      });
  }


}
