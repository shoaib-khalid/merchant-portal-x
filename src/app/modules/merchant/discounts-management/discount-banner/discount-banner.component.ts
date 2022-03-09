import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef, ViewContainerRef, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatDialog } from '@angular/material/dialog';
import { NgxGalleryAnimation, NgxGalleryOptions } from 'ngx-gallery-9';
import { StoresService } from 'app/core/store/store.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector       : 'discount-banner',
    templateUrl    : './discount-banner.component.html',
    styles         : [
        /* language=SCSS */
        `
            .product-discount-grid {
                grid-template-columns: 72px auto 40px;

                @screen sm {
                    grid-template-columns: 20px 112px auto 72px;
                }

                @screen lg {
                    grid-template-columns: 20px 112px auto 180px 180px 180px 72px;
                }
            }
        `
    ],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations     : fuseAnimations
})
export class DiscountBannerComponent implements OnInit, AfterViewInit, OnDestroy
{

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    storeId: string;

    files: any;
    galleryOptions: NgxGalleryOptions[] = [];


    /**
     * Constructor
     */
    constructor(
        public _dialog: MatDialog,
        private _storesService: StoresService,
        private _changeDetectorRef: ChangeDetectorRef,
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
        this.files =
        { 
            description: "DiscountBanner",
            type: "DiscountBannerUrl",
            assetId: null, 
            fileSource: null,
            selectedFileName: "", 
            selectedFiles: null, 
            recommendedImageWidth: "1440", 
            recommendedImageHeight: "560", 
            selectedImageWidth: "", 
            selectedImageHeight: "",
            isMultiple: false,
            toDelete: false,
            // toDelete: [],
            // toAdd:[], 
            galleryImages: []
        }

        // // initialise gallery
        // // set galleryOptions for multiple images
        // this.galleryOptions = [
        //     {
        //         width: '350px',
        //         height: '350px',
        //         thumbnailsColumns: 3,
        //         imageAnimation: NgxGalleryAnimation.Slide,
        //         thumbnailsArrows: true,
        //         // previewDownload: true,
        //         imageArrowsAutoHide: true, 
        //         thumbnailsArrowsAutoHide: true,
        //         thumbnailsAutoHide: false,
        //         thumbnailActions: [
        //             {
        //                 icon: 'fa fa-times-circle',
        //                 onClick: (event, index) => {
                            
        //                     this.deleteBannerDiscount(event, index)
        //                 },
        //             }
        //         ],
        //         // "imageSize": "contain",
        //         "previewCloseOnClick": true, 
        //         "previewCloseOnEsc": true,
        //         // "thumbnailsRemainingCount": true
        //     },
        //     // max-width 767 Mobile configuration
        //     {
        //         breakpoint: 767,
        //         thumbnailsColumns: 2,
        //         thumbnailsAutoHide: false,
        //         width: '350px',
        //         height: '350px',
        //         imagePercent: 100,
        //         thumbnailsPercent: 30,
        //         thumbnailsMargin: 10,
        //         thumbnailMargin: 5,
        //         thumbnailActions: [
        //             {
        //                 icon: 'fa fa-times-circle',
        //                 onClick: () => {},
        //             }
        //         ]
        //     }
        // ];

        this.storeId = this.storeId$;
        
        // ----------------------
        // Get Store Details by Id
        // ----------------------

        this._storesService.getStoreById(this.storeId).subscribe(
            (response) => { 

                // set store to current store
                this._storesService.store = response;
                this._storesService.storeId = this.storeId;
                
                // ----------------
                // set assets image
                // ----------------
                
                response.storeAssets.map(item => {
                    
                    if (item.assetType === "DiscountBannerUrl") {
                        // for single
                        this.files.fileSource = item.assetUrl;
                        this.files.assetId = item.id;
                        // //for multiple image 
                        // this.files.galleryImages.push({
                        //     small       : '' + item.assetUrl,
                        //     medium      : '' + item.assetUrl,
                        //     big         : '' + item.assetUrl,
                        //     assetId     : item.id
                        // });    
                    }
                    // Mark for check
                    this._changeDetectorRef.markForCheck();

                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            } 
        );

    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
      
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Method
    // -----------------------------------------------------------------------------------------------------

    // /**
    // * 
    // * @param event for ---------------multiple selectFiles----------------
    // */
    // selectFiles(event: any): void {
        
    //     // set each of the attributes        
    //     if (event.target.files.length > 0) {
    //         this.files.fileSource = null;
    //         this.files.selectedFileName = "";
    //         this.files.selectedFiles = event.target.files;
    //     }
        
    //     let maxSize = 2097152;
    //     var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
    //     if (this.files.selectedFiles[0].size > maxSize ){
    //         // Show a success message (it can also be an error message)
    //         const confirmation = this._fuseConfirmationService.open({
    //             title  : 'Image size limit',
    //             message: 'Your uploaded image is exceeds the maximum size of ' + maxSizeInMB + ' MB !',
    //             icon: {
    //                 show: true,
    //                 name: "image_not_supported",
    //                 color: "warn"
    //             },
    //             actions: {
    //                 confirm: {
    //                     label: 'Ok',
    //                     color: "primary",
    //                 },
    //                 cancel: {
    //                     show: false,
    //                 },
    //             }
    //         });
    //         return;
    //     }

    //     if (this.files.selectedFiles && this.files.selectedFiles[0] && this.files.selectedFiles[0].size < maxSize ) {
    //         const numberOfFiles = this.files.selectedFiles.length;
    //         for (let i = 0; i < numberOfFiles; i++) {
    //         const reader = new FileReader();
            
    //         reader.onload = (e: any) => {
    //             this.files.fileSource = e.target.result;
    //             this.files.toAdd.push(event.target.files);
                
    //             if(this.files.galleryImages.length < 3){
                    
    //                 this.files.galleryImages.unshift({
    //                     small           : '' + e.target.result,
    //                     medium          : '' + e.target.result,
    //                     big             : '' + e.target.result
    //                 });

    //                 var image = new Image();
    //                 image.src = e.target.result;
    
    //                 image.onload = (imageInfo: any) => {
    //                     this.files.selectedImageWidth = imageInfo.path[0].width;
    //                     this.files.selectedImageHeight = imageInfo.path[0].height;
    
    //                     this._changeDetectorRef.markForCheck();
    //                 };
    //             } 
    //             this._changeDetectorRef.markForCheck();               
    //         };
            
    //         reader.readAsDataURL(this.files.selectedFiles[i]);
    //         this.files.selectedFileName = this.files.selectedFiles[i].name;
    //         }
    //     }
    //     this._changeDetectorRef.markForCheck();
    // }

    // For single image select files
    selectFiles(event) {

        // set each of the attributes        
        if (event.target.files.length > 0) {
            this.files.fileSource = null;
            this.files.selectedFileName = "";
            this.files.selectedFiles = event.target.files;
        }
        
        let maxSize = 2097152;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
        if (this.files.selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image is exceeds the maximum size of ' + maxSizeInMB + ' MB !',
                icon: {
                    show: true,
                    name: "image_not_supported",
                    color: "warn"
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
            return;
        }

        if (this.files.selectedFiles && this.files.selectedFiles[0] && this.files.selectedFiles[0].size < maxSize ) {
            const numberOfFiles = this.files.selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
            
            reader.onload = (e: any) => {

                this.files.fileSource = e.target.result;

                var image = new Image();
                image.src = e.target.result;

                image.onload = (imageInfo: any) => {
                    this.files.selectedImageWidth = imageInfo.path[0].width;
                    this.files.selectedImageHeight = imageInfo.path[0].height;

                    this._changeDetectorRef.markForCheck();
                };
                
                this._changeDetectorRef.markForCheck();                
            };
            
            reader.readAsDataURL(this.files.selectedFiles[i]);
            this.files.selectedFileName = this.files.selectedFiles[i].name;
            }
        }
        this._changeDetectorRef.markForCheck();
    }
    
    updateDiscountBannerAssets(): void
    {
        // ---------------------------
        // Update Store Assets
        // ---------------------------

        let discountBanner = this.files
 
        // // BannerDesktop update using loop for each for delete and post (for multiple Image)
        // if(discountBanner.type === 'DiscountBannerUrl') {
        //     // toDelete
        //     discountBanner.toDelete.forEach(assetId => {
        //         if(assetId){
        //             this._storesService.deleteAssets(this.storeId, assetId)
        //             .subscribe(response => {
        //                     console.info('Uploaded the file successfully');
    
        //                     // Mark for check
        //                     this._changeDetectorRef.markForCheck();
        //                 },
        //                 (err: any) => {
        //                     console.error('Could not upload the file');
        //             });
        //         }
        //     });
        //     // toAdd
        //     discountBanner.toAdd.forEach(selectedFiles => {
        //         let formData = new FormData();
        //         formData.append('assetFile',selectedFiles[0]);
        //         formData.append('assetType',discountBanner.type);
        //         formData.append('assetDescription',discountBanner.description);

        //         if (discountBanner.selectedFiles && discountBanner.selectedFiles !== null) {
        //             this._storesService.postAssets(this.storeId, "DiscountBannerUrl", formData,"DiscountBanner")
        //             .subscribe(response => {
        //                 console.info('Uploaded the file successfully');

        //                 this.files.assetId = event["id"];

        //                 // Mark for check
        //                 this._changeDetectorRef.markForCheck();
        //             },
        //             (err: any) => {
        //                 console.error('Could not upload the file');
        //             });
        //         }
        //     }); 
        // }

        //discount banner update using selected files (for single image)
        if (discountBanner.type === 'DiscountBannerUrl'){
    
            let formData = new FormData();

            if (discountBanner.selectedFiles && discountBanner.selectedFiles !== null){
                formData.append('assetFile',discountBanner.selectedFiles[0]);
                formData.append('assetType',discountBanner.type);
                formData.append('assetDescription',discountBanner.description);
            }

            if (discountBanner.selectedFiles && discountBanner.assetId !== null && discountBanner.toDelete === false) {                   
                this._storesService.putAssets(this.storeId, discountBanner.assetId, formData, "DiscountBannerUrl")
                    .subscribe(response => {
                        console.info('Uploaded the file successfully');

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, (err: any) => {
                            console.error('Could not upload the file');
                    });
            } else if (discountBanner.toDelete === true && discountBanner.assetId !== null) {
                this._storesService.deleteAssets(this.storeId, discountBanner.assetId)
                    .subscribe(response => {
                        console.info('Uploaded the file successfully');

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                        },
                        (err: any) => {
                            console.error('Could not upload the file');
                        });
            } else {
                if (discountBanner.selectedFiles && discountBanner.selectedFiles !== null) {
                    this._storesService.postAssets(this.storeId, "DiscountBannerUrl", formData,"DiscountBanner")
                        .subscribe(response => {
                            console.info('Uploaded the file successfully');

                            discountBanner.assetId = event["id"];

                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        },
                        (err: any) => {
                            console.error('Could not upload the file');
                        });
                }
            }
        }
        

        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your store dicount banner has been updated successfully!',
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
    }

    // deleteBannerDiscount(e, index){
    //     let assetId = this.files.galleryImages[index].assetId;

    //     this.files.toDelete.push(assetId);
    //     this.files.galleryImages.splice(index,1);

    //     if(this.files.galleryImages.length < 1){
    //         this.files.fileSource = null
    //     }
    // }

    //for single image
    deleteDiscountBanner() {
        this.files.toDelete = true;        
        this.files.fileSource = '';
        this._changeDetectorRef.markForCheck();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Method
    // -----------------------------------------------------------------------------------------------------
}
