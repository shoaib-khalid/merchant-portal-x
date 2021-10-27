import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { RegisterStoreService } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.service';
import { Observable } from 'rxjs';

@Component({
    selector     : 'register-store-page',
    templateUrl  : './register-store.component.html',
    styles       : ['.ql-container { height: 156px; }'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class RegisterStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;

    alert: any;
    supportForm: FormGroup;
    isDescriptionEmpty: boolean = false;

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

    // Image part

    selectedFiles?: FileList;
    selectedFileNames: string[] = [];
  
    progressInfos: any[] = [];
    message: string[] = [];
  
    previews: string[] = [];
    imageInfos?: Observable<any>;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _registerStoreService: RegisterStoreService,
        private _changeDetectorRef: ChangeDetectorRef,
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
        // Create the support form
        this.supportForm = this._formBuilder.group({
            name          : ['', Validators.required],
            description   : ['', Validators.required],
            email         : ['', [Validators.required, Validators.email]],
            subject       : ['', Validators.required],
            message       : ['', Validators.required],
            region       : ['', Validators.required],
            deliveryType  : ['', Validators.required],
            deliveryFullfilment : [[
                { selected: false, option: "INSTANT_DELIVERY", label: "Instant Delivery", tooltip: "This store support instant delivery. (Provided by store own logistic or delivery partners)" }, 
                { selected: false, option: "REGULAR_DELIVERY", label: "Regular Delivery", tooltip: "This store support regular delivery. (Provided by store own logistic or delivery partners)" },
                { selected: false, option: "SCHEDULED_DELIVERY", label: "Scheduled Delivery", tooltip: "This store allow scheduled delivery request from customer" },
                { selected: false, option: "STORE_PICKUP", label: "Allow Store Pickup", tooltip: "This store allow customer to pick up item from store" }
            ]],
            deliveryPartners    : [[
                { selected: false, option: "LALA_MOVE", label: "Lala Move" },
                { selected: false, option: "MRSPEEDY", label: "MrSpeedy" },
            ]],
            selectedDeliveryStates: ['', Validators.required],
            deliveryStates      : [[
                { country: "MY", states: ["Johor","Kedah","Kelantan","Kuala Lumpur","Malacca","Negeri Sembilan", "Pahang", "Pulau Pinang", "Perak", "Perlis", "Sabah", "Serawak", "Selangor"] },
                { country: "PK", states: ["Balochistan","Federal","Khyber Pakhtunkhwa", "Punjab", "Sindh"] }
            ]],
            paymentType  : ['', Validators.required],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Clear the form
     */
    clearForm(): void
    {
        // Reset the form
        this.supportNgForm.resetForm();
    }

    /**
     * Check Description
     */
    checkDescription(): void
    {
        // On data changes
        this.supportForm.valueChanges.subscribe(data => {
            if(data.description === '' || data.description === null) {
                this.isDescriptionEmpty = true;
            } else {
                this.isDescriptionEmpty = false;
            }
        })

        // On focusout
        if (this.supportForm.get('description').value === '' || this.supportForm.get('description').value === null){
            this.isDescriptionEmpty = true;
        } else {
            this.isDescriptionEmpty = false;
        }
    }


    /**
     * Send the form
     */
    sendForm(): void
    {
        // Send your form here using an http request
        console.log('Your message has been sent!');

        // Show a success message (it can also be an error message)
        // and remove it after 5 seconds
        this.alert = {
            type   : 'success',
            message: 'Your request has been delivered! A member of our support staff will respond as soon as possible.'
        };

        setTimeout(() => {
            this.alert = null;
        }, 7000);

        // Clear the form
        this.clearForm();
    }

    /**
     * tahu la
     * @param event 
     */
    selectFiles(event: any): void {
        this.message = [];
        this.progressInfos = [];
        this.selectedFileNames = [];
        this.selectedFiles = event.target.files;
      
        this.previews = [];
        if (this.selectedFiles && this.selectedFiles[0]) {
            const numberOfFiles = this.selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
        
            reader.onload = (e: any) => {
                console.log(e.target.result);
                this.previews.push(e.target.result);
            };
        
            reader.readAsDataURL(this.selectedFiles[i]);
        
            this.selectedFileNames.push(this.selectedFiles[i].name);
            }
        }
        this._changeDetectorRef.markForCheck();
    }

    uploadFiles(): void {
        this.message = [];
      
        if (this.selectedFiles) {
          for (let i = 0; i < this.selectedFiles.length; i++) {
            // this.upload(i, this.selectedFiles[i]);
          }
        }
    }

    upload(idx: number, file: File): void {
        this.progressInfos[idx] = { value: 0, fileName: file.name };
      
        // if (file) {
        //   this.uploadService.upload(file).subscribe(
        //     (event: any) => {
        //       if (event.type === HttpEventType.UploadProgress) {
        //         this.progressInfos[idx].value = Math.round(100 * event.loaded / event.total);
        //       } else if (event instanceof HttpResponse) {
        //         const msg = 'Uploaded the file successfully: ' + file.name;
        //         this.message.push(msg);
        //         this.imageInfos = this.uploadService.getFiles();
        //       }
        //     },
        //     (err: any) => {
        //       this.progressInfos[idx].value = 0;
        //       const msg = 'Could not upload the file: ' + file.name;
        //       this.message.push(msg);
        //     });
        // }
    }
}
