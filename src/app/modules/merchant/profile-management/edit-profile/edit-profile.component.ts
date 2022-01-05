import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from 'app/core/user/user.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
    selector     : 'edit-profile-page',
    templateUrl  : './edit-profile.component.html',
    styles       : ['.ql-container { height: 156px; }'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class EditProfileComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;
    @ViewChild('drawer') drawer: MatDrawer;

    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'account';

    clientPaymentId: string;

    alert: any;
    editProfileForm: FormGroup;

    // Image part    
    files: any;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _userService: UserService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _changeDetectorRef: ChangeDetectorRef,
        public _dialog: MatDialog,
    )
    {
        // this.checkExistingURL = debounce(this.checkExistingURL, 300);
        // this.checkExistingName = debounce(this.checkExistingName,300);
    }

    /**
     * Getter for access token
    */

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }    

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the support form
        this.editProfileForm = this._formBuilder.group({
            // Main Store Section
            username           : ['', Validators.required],
            name               : ['', Validators.required],
            email              : ['', [Validators.required, Validators.email]],
            // phoneNumber        : ['', RegisterStoreValidationService.phonenumberValidator],
            bankName           : ['', Validators.required],
            bankAccountNumber  : ['', Validators.required],
            bankAccountTitle  : ['', Validators.required],
            
            
        });

         // Setup available panels
         this.panels = [
            {
                id         : 'account',
                icon       : 'heroicons_outline:user-circle',
                title      : 'Account',
                description: 'Manage your public profile and private information'
            },
            {
                id         : 'security',
                icon       : 'heroicons_outline:lock-closed',
                title      : 'Security',
                description: 'Manage your password and 2-step verification preferences'
            },
            {
                id         : 'plan-billing',
                icon       : 'heroicons_outline:credit-card',
                title      : 'Plan & Billing',
                description: 'Manage your subscription plan, payment method and billing information'
            },
            // {
            //     id         : 'notifications',
            //     icon       : 'heroicons_outline:bell',
            //     title      : 'Notifications',
            //     description: 'Manage when you\'ll be notified on which channels'
            // },
            // {
            //     id         : 'team',
            //     icon       : 'heroicons_outline:user-group',
            //     title      : 'Team',
            //     description: 'Manage your existing team and change roles/permissions'
            // }
        ];
        // Logo & Banner
        this.files = [
            { 
                type: "logo", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "banner", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "bannerMobile", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
        ];

        // ----------------------
        // Get client Details
        // ----------------------

        this._userService.client$.subscribe(
            (response) => {
                // Fill the form
                this.editProfileForm.patchValue(response);
                
            } 
        );
        
        // ----------------------
        // Get client payment Details
        // ----------------------

        this._userService.clientPaymentDetails$.subscribe(
            (response) => {
                // Fill the form
                //response?. to handle if it is undefined
                this.editProfileForm.get('bankAccountNumber').patchValue(response?.bankAccountNumber?response.bankAccountNumber:null);
                this.editProfileForm.get('bankName').patchValue(response?.bankName?response.bankName:null);
                this.editProfileForm.get('bankAccountTitle').patchValue(response?.bankAccountTitle?response.bankAccountTitle:null);

                this.clientPaymentId = response?.id?response.id:null;
                
          
            } 
        );   

    }

    ngAfterViewInit(): void{
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

     /**
     * Navigate to the panel
     *
     * @param panel
     */
    goToPanel(panel: string): void
    {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if ( this.drawerMode === 'over' )
        {
            this.drawer.close();
        }
    }
  
    /**
     * Get the details of the panel
     *
     * @param id
     */
    getPanelInfo(id: string): any
    {
        return this.panels.find(panel => panel.id === id);
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
     * Clear the form
     */
    clearForm(): void
    {
        // Reset the form
        this.supportNgForm.resetForm();
    }

    /**
     * Send the form
     */
    updateClientProfile(): void
    {
        // Do nothing if the form is invalid
        if ( this.editProfileForm.invalid )
        {
            return;
        }

        // Hide the alert
        this.alert = false;

        /**
         * 
         * Register Store Section
         * 
         */
        // Disable the form
        this.editProfileForm.disable();

        // update profile
        this._userService.updateClientProfile(this.editProfileForm.value)
            .subscribe((response) => {

            });

        let newBody = {
            bankAccountNumber: this.editProfileForm.get('bankAccountNumber').value,
            bankName : this.editProfileForm.get('bankName').value,
            bankAccountTitle : this.editProfileForm.get('bankAccountTitle').value
        };

        if(this.clientPaymentId !==null){
            // update payment profile
            this._userService.updatePaymentProfile(this.clientPaymentId, newBody)
            .subscribe((response) => {

            });
        } else {
            // create payment profile
            this._userService.createPaymentProfile(newBody)
            .subscribe((response) => {

            });
        }

        // Show a success message (it can also be an error message)
                        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your profile has been updated successfully!',
            icon: {
                show: true,
                name: "heroicons_outline:check",
                color: "success"
            },
            actions: {
                confirm: {
                    label: 'Ok',
                    color: "primary",
                },
                cancel: {
                    show: false,
                },
            }
        });

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Enable the form
        this.editProfileForm.enable();
    }

    /**
     * 
     * @param event 
     */
    selectFiles(fileType,event: any): void {
      
        // find index of object this.files
        let index = this.files.findIndex(preview => preview.type === fileType);

        // set each of the attributes
        this.files[index].fileSource = null;
        this.files[index].selectedFileName = "";
        this.files[index].selectedFiles = event.target.files;

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0]) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
            
            reader.onload = (e: any) => {
                
                // set this.files[index].delete to false 
                this.files[index].toDelete = false;

                this.files[index].fileSource = e.target.result;

                var image = new Image();
                image.src = e.target.result;

                image.onload = (imageInfo: any) => {
                    this.files[index].selectedImageWidth = imageInfo.path[0].width;
                    this.files[index].selectedImageHeight = imageInfo.path[0].height;

                    this._changeDetectorRef.markForCheck();
                };

                this._changeDetectorRef.markForCheck();                
            };
            // console.log("this.files["+index+"].selectedFiles["+i+"]",this.files[index].selectedFiles[i])
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
            }
        }
        this._changeDetectorRef.markForCheck();
    }

    deletefiles(index: number) { 
        this.files[index].toDelete = true;
        this.files[index].fileSource = '';

        this._changeDetectorRef.markForCheck();
    }
    
}