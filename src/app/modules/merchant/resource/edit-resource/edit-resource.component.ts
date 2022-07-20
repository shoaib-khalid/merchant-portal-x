import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray, FormControl, FormBuilder, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { InventoryService } from 'app/core/product/inventory.service';
import { Product, ProductPagination, ProductInventory, ProductPackageOption, ProductCategory, ProductAssets, ProductVariant, ProductVariantAvailable } from 'app/core/product/inventory.types';
import { ResourceService } from 'app/core/resource/resource.service';
import { Resource, ResourceAvailability } from 'app/core/resource/resource.types';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';
import { error } from 'console';
import { add, forEach } from 'lodash';
import { Observable, Subject, takeUntil, debounceTime, switchMap, of, map, merge, fromEvent } from 'rxjs';
import { ApiResponseModel } from '../../discounts-management/order-discount/order-discount-list/order-discount-list.types';
import { EditProductComponent } from '../../products-management/edit-product/edit-product.component';

@Component({
	selector: 'app-edit-resource',
	templateUrl: './edit-resource.component.html',
	styles: [
		`
	.custom-edit-resource-dialog {

		:host ::ng-deep .mat-horizontal-content-container {
			 /* max-height: 90vh; */
			padding: 0 0px 20px 0px;
			/* overflow-y: auto; */
		}
	
		:host ::ng-deep .mat-horizontal-stepper-header-container {
			 /* height: 60px; */
		}
	
		:host ::ng-deep .mat-horizontal-stepper-header {
			height: 60px;
			padding-left: 8px;
			padding-right: 8px;
		}
	
		:host ::ng-deep .mat-paginator .mat-paginator-container {
			padding: 0px 16px;
			justify-content: center;
		}
	
		:host ::ng-deep .mat-paginator-outer-container {
			display: flex;
			height: 40px;
		}
	}
	
	.content {
	
		max-height: 90vh;
		height: 90vh;
	
		@screen sm {
			max-height: 560px;
			height: 75vh;
		}
	
		/* overflow-y: auto; */
	}
	
	:host ::ng-deep .ql-container .ql-editor {
		min-height: 87px;
		max-height: 87px;
		height: 87px;
	}
	
	.edit-order-discount-grid {
            grid-template-columns: 0px 180px 130px 80px 160px 100px 160px 80px;

            @screen xl {
                grid-template-columns: 0px 160px 130px 130px 160px 130px 160px 100px 0px;
            }
        }`]
})
export class EditResourceComponent implements OnInit, OnDestroy {

	utcTimezones = require('../add-resource/utc_timzones.json');


	/*  get current store */
	store$: Store;

	checkinput = {
		name: false,
		description: false,
		status: false,
		sku: false,
		price: false,
		packingSize: false,
		category: false,
		availableStock: false
	};

	message: string = "";

	/* Resource */
	selectedResource: Resource | null = null;
	addResourceForm: FormGroup;
	resources$: Observable<Resource[]>;
	newResourceId: string = null;
	creatingResource: boolean;

	/* Resource Availability */
	listOfResourceAvailabilities: ResourceAvailability[] = [];
	resourceAvailabilities$: Observable<ResourceAvailability[]>;
	resourceAvailability: ResourceAvailability | null = null;
	resourceAvailabilityToBeCreated: any[] = [];
	resourceAvailabilityToBeDeleted: any[] = [];
	resourceAvailabilityFA: FormArray;
	resourceAvailability$: ResourceAvailability[] = [];

	/* product */
	selectedProduct: Product | null = null;
	products$: Observable<Product[]>;
	productType: string;
	newProductId: string = null; // product id after it is created
	creatingProduct: boolean; // use to disable next button until product is created
	allProductsFiltered: Product[]; // used for checking if product name already exist 
	productPagination: ProductPagination = { length: 0, page: 0, size: 0, lastPage: 0, startIndex: 0, endIndex: 0 };


	// inventories
	productInventoriesFA: FormArray;
	productInventories$: ProductInventory[] = [];

	// product category
	productCategories$: ProductCategory[];
	filteredProductCategories: ProductCategory[];
	selectedProductCategory: ProductCategory;

	productCategoriesEditMode: boolean = false;
	productCategoriesValueEditMode: any = [];

	// product assets
	images: any = [];
	imagesFile: any = [];
	thumbnailIndex: number = 0;
	currentImageIndex: number = 0;
	imagesEditMode: boolean = false;
	productAssets$: ProductAssets[] = [];
	variantimages: any = [];
	productAssetsFA: FormArray;
	imagesToBeDeleted: any = []; // images to be deleted from BE
	imagesWithId: any = [];

	offsetName: any;


	private _unsubscribeAll: Subject<any> = new Subject<any>();
	private _variantsPanelOverlayRef: OverlayRef;

	quillModules: any = {
		toolbar: [
			['bold', 'italic', 'underline'],
			[{ align: [] }, { list: 'ordered' }, { list: 'bullet' }],
			[{
				link: function (value) {
					if (value) {
						var href = prompt('Enter the URL');
						this.quill.format('link', href);
					} else {
						this.quill.format('link', false);
					}
				}
			}],
			['blockquote', 'clean']
		]
	};


	flashMessage: 'success' | 'error' | 'warning' | null = null;


	// sku, price & quantity 
	// reason these 3 not in formbuilder is because it's not part of product but 
	// it's part of product inventory (it's here for display only)
	displaySku: string = "";
	displayPrice: number = 0;
	displayQuantity: number = 0;
	currentScreenSize: string[];
	deliveryVehicle: any;
	isLoading: boolean = false;

	inputSearchProducts: string = '';
	selectedCategory: string = '';
	onChangeSelectProductValue: any = []; // for product checkbox in combo section
	totalAllowed: number = 0;

	storeVerticalCode: string = '';
	parentCategoriesOptions: ProductCategory[];
	selectedParentCategory: string = '';

	availabilityDay: string;
	durationInMinutes: number = 30;
	startTime: any;
	endTime: any;
	offsetHours: any;
	confirmationMethodStr: string;

	storeDiscountTierListValueEditMode: any = [];

	storeDiscountTierList: FormArray;

	//disable add tier button 
	isDisplayAddTier: boolean = false;

	_listOfResourceAvailabilities: ResourceAvailability[] = [];

	changeStartTime: string;
	changeEndTime: string;


	confirmationMethod = [
		"DEFAULT",
		"MERCHANT",
		"PAYMENT",
		"EMAIL",
		"PHONE"
	];


	/**
 * Constructor
 */
	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _fuseConfirmationService: FuseConfirmationService,
		private _formBuilder: FormBuilder,
		private _inventoryService: InventoryService,
		private _storesService: StoresService,
		public _dialog: MatDialog,
		private _overlay: Overlay,
		private _renderer2: Renderer2,
		private _viewContainerRef: ViewContainerRef,
		public dialogRef: MatDialogRef<EditResourceComponent>,
		@Inject(MAT_DIALOG_DATA) public data: MatDialog,
		private _fuseMediaWatcherService: FuseMediaWatcherService,
		private _resourceService: ResourceService

	) {
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Accessors
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Getter for storeId
	 */

	get storeId$(): string {
		return localStorage.getItem('storeId') ?? '';
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Lifecycle hooks
	// -----------------------------------------------------------------------------------------------------

	/**
	 * On init
	 */
	ngOnInit(): void {
		// Horizontol stepper
		this.addResourceForm = this._formBuilder.group({
			step1: this._formBuilder.group({
				name: ['', [Validators.required]],
				description: ['', [Validators.required]],
				categoryId: ['', [Validators.required]],
				status: ['ACTIVE', [Validators.required]],
				availableStock: [1, [Validators.required]],
				sku: ['', [Validators.required]],
				price: ['', [Validators.required]],
				images: [[]],
				imagefiles: [[]],
				thumbnailIndex: [0],
				productAssets: this._formBuilder.array([]),
				productInventories: this._formBuilder.array([]),
				productVariants: this._formBuilder.array([]),
				resourceAvailabilities: this._formBuilder.array([]),
				// form completion
				isAvailabilityToggle: false,
				valid: [false]
			}),
			step2: this._formBuilder.array([

			]),
		});

		// get the product id

		this.setDetails(this.data['productId'], this.data['resourceId']);

		// Get the stores
		this._storesService.store$
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((store: Store) => {

				// Update the pagination
				this.store$ = store;
				this.storeVerticalCode = this.store$.verticalCode;

				// set packingSize to S if verticalCode FnB
				if (this.store$.verticalCode === "FnB" || this.store$.verticalCode === "FnB_PK") {
					this.addResourceForm.get('step1').get('packingSize').patchValue('S');
					this.checkinput.packingSize = true;
				}

				// Mark for check
				this._changeDetectorRef.markForCheck();
			});

		//get all values for parent categories with specied vertical code
		this._inventoryService.getParentCategories(0, 20, 'name', 'asc', '', this.storeVerticalCode)
			.subscribe((response: ApiResponseModel<ProductCategory[]>) => {

				this.parentCategoriesOptions = response.data["content"];
				return this.parentCategoriesOptions;
			})


		// Get the categories
		this._inventoryService.categories$
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((categories: ProductCategory[]) => {

				// Update the categories
				this.productCategories$ = categories;
				this.filteredProductCategories = categories;


				// Mark for check
				this._changeDetectorRef.markForCheck();
			});

		// rest of the input checking process occur at bottom
		// refer function checkInput().... lol
		this.addResourceForm.valueChanges.subscribe(data => {
			if (data.description) {
				this.checkinput['description'] = true;
			} else {
				this.checkinput['description'] = false;
			}
		})


		//Resource Availability Check
		this._resourceService.getResourceByIdResponse(this.data['resourceId']).subscribe(
			(response: ApiResponseModel<Resource>) => {

				// clear discount tier form array
				(this.addResourceForm.get('step2') as FormArray).clear();

				let resourceAvailabilites = this._resourceService.getAllResourceAvailabilitesByResource(this.data['resourceId']);
				resourceAvailabilites.subscribe((availabilities) => {
					this.storeDiscountTierList = this.addResourceForm.get('step2') as FormArray;

					availabilities['data'].forEach(item => {
						this.storeDiscountTierList.push(this._formBuilder.group(item));
					});

					if (availabilities['data'].length > 0) {
						this.addResourceForm.get('step1').get('isAvailabilityToggle').setValue(true);
					}


				});

				// Mark for check
				this._changeDetectorRef.markForCheck();
			}
		);


		this._fuseMediaWatcherService.onMediaChange$
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe(({ matchingAliases }) => {

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
	ngOnDestroy(): void {
		// Unsubscribe from all subscriptions
		this._unsubscribeAll.next(null);
		this._unsubscribeAll.complete();

		// Dispose the overlays if they are still on the DOM
		if (this._variantsPanelOverlayRef) {
			this._variantsPanelOverlayRef.dispose();
		}
	}

	ngAfterViewInit(): void {
		// Mark for check
		this._changeDetectorRef.markForCheck();

		setTimeout(() => {

			// Mark for check
			this._changeDetectorRef.markForCheck();


			// Mark for check
			this._changeDetectorRef.markForCheck();

		}, 150);

		// Mark for check
		this._changeDetectorRef.markForCheck();
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	// --------------------------------------
	// Product Section
	// --------------------------------------
	/**
	 * Set product details
	 *
	 * @param productId
	 */
	setDetails(productId: string, resourceId: string): void {


		// If the product is already selected...
		if (this.selectedProduct && this.selectedProduct.id === productId) {
			// Close the details
			//  this.closeDetails();
			return;
		}

		// If the resource is already selected
		if (this.selectedResource && this.selectedResource.id === resourceId) {
			return;
		}

		// Get the product by id
		this._inventoryService.getProductById(productId)
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((response) => {

				let product = response["data"];

				// check for product that does not have product inventories, and add them
				if (product.productInventories.length < 1) {
					// tempSku is generated automatically since there are no product inventory
					let tempSku = product.name.substring(1).toLowerCase().replace(" / ", "-");
					// Add Inventory to product
					this._inventoryService.addInventoryToProduct(product, { sku: tempSku, quantity: 0, price: 0, itemCode: productId + "aa" })
						.subscribe((response) => {

							// update product
							product.productInventories = [response];

							// update sku, price, quantity display since it's not part of product but product inventory
							//  this.displayPrice = response.price;
							//  this.displayQuantity = response.quantity;
							//  this.displaySku = response.sku;

							this.addResourceForm.get('step1').get('sku').setValue(response.sku);
							this.addResourceForm.get('step1').get('price').setValue(response.price);
							this.addResourceForm.get('step1').get('availableStock').setValue(response.quantity);

							this.loadProductDetails(product);
						});
				} else {
					this.loadProductDetails(product);
				}

				// Mark for check
				this._changeDetectorRef.markForCheck();
			});

		this._resourceService.getResourceById(resourceId)
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((response) => {

				let resource = response["data"];

				this.loadResourceDetails(resource);

				// Mark for check
				this._changeDetectorRef.markForCheck();
			});
	}

	// Extension of toggleDetails()
	loadProductDetails(product: Product) {



		// Set the selected product
		this.selectedProduct = product;

		// Fill the form
		this.addResourceForm.get('step1').patchValue(product);

		// Fill the form for SKU , Price & Quantity productInventories[0]
		// this because SKU , Price & Quantity migh have variants
		// this is only for display, so we display the productInventories[0] 
		// this.displaySku = product.productInventories[0].sku;
		// this.displayPrice = product.productInventories[0].price;
		// this.displayQuantity = product.productInventories[0].quantity;

		this.addResourceForm.get('step1').get('sku').setValue(product.productInventories[0].sku);
		this.addResourceForm.get('step1').get('price').setValue(product.productInventories[0].price);
		this.addResourceForm.get('step1').get('availableStock').setValue(this.totalInventories(product.productInventories));

		// ---------------------
		// Images
		// ---------------------

		// Sort productAssets and place itemCode null in front, after that variants image
		let imagesObjSorted = product.productAssets.sort(this.dynamicSort("itemCode"));
		let imageArr = imagesObjSorted.map(item => item.url);

		imagesObjSorted.forEach(item => {
			this.imagesWithId.push({ id: item.id, url: item.url })
		})

		this.images = imageArr;

		// get thumbnail index
		let _thumbnailIndex = null;

		_thumbnailIndex = imagesObjSorted.findIndex(item => item.isThumbnail === true);

		this.thumbnailIndex = _thumbnailIndex === -1 ? 0 : _thumbnailIndex;

		// ---------------------
		// Product Assets
		// ---------------------

		this.productAssets$ = product.productAssets;

		this.productAssetsFA = this.addResourceForm.get('step1').get('productAssets') as FormArray;
		// this.productAssets.clear();


		this.imagesFile = [];

		this.productAssets$.forEach(item => {
			this.productAssetsFA.push(this._formBuilder.group(item));
			this.imagesFile.push(null) // push imagesFile with null to defined now many array in imagesFile
		});

		// ---------------------
		// Product Inventories
		// ---------------------

		this.productInventories$ = product.productInventories;
		this.productInventoriesFA = this.addResourceForm.get('step1').get('productInventories') as FormArray;
		// this.productInventories.clear();

		this.productInventories$.forEach(item => {
			this.productInventoriesFA.push(this._formBuilder.group(item));
		});

		// ---------------------
		// Category
		// ---------------------

		// Add the category
		this.selectedProduct.categoryId = product.categoryId;

		// Update the selected product form
		this.addResourceForm.get('step1').get('categoryId').patchValue(this.selectedProduct.categoryId);

		//to get the details of catgeory and show the tier category
		this._inventoryService.getCategoriesById(product.categoryId).subscribe((res: ProductCategory) => {
			this.selectedParentCategory = res.parentCategoryId;

		})

		// Sort the filtered categories, put selected category on top
		// First get selected array index by using this.selectedProduct.categoryId

		let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.selectedProduct.categoryId);
		// if selectedProductCategoryIndex < -1 // category not selected
		// if selectedProductCategoryIndex = 0 // category selected already in first element
		if (selectedProductCategoryIndex > 0) {
			// if index exists get the object of selectedProductCategory
			this.selectedProductCategory = this.filteredProductCategories[selectedProductCategoryIndex];
			// remove the object from this.filteredProductCategories
			this.filteredProductCategories.splice(selectedProductCategoryIndex, 1);
			// re add this.selectedProductCategory in front
			this.filteredProductCategories.unshift(this.selectedProductCategory);
		}

		// ---------------------
		// Inventory Alarm
		// ---------------------

		this.selectedProduct.minQuantityForAlarm = product.minQuantityForAlarm;

	}

	async loadResourceDetails(resource: Resource) {


		// Set the selected product
		this.selectedResource = resource;

		//If SKU IS NEEDED
		/* this.addResourceForm.get('step1').get('sku').setValue(this.selectedProduct.productInventories[0].sku); */
		this.addResourceForm.get('step1').get('price').setValue(resource.price);
		this.addResourceForm.get('step1').get('availableStock').setValue(resource.numberOfWeeksReservable);

		// ---------------------
		// Images
		// ---------------------

		// Sort productAssets and place itemCode null in front, after that variants image
		let imagesObjSorted = this.selectedProduct.productAssets.sort(this.dynamicSort("itemCode"));
		let imageArr = imagesObjSorted.map(item => item.url);

		imagesObjSorted.forEach(item => {
			this.imagesWithId.push({ id: item.id, url: item.url })
		})

		this.images = imageArr;

		// get thumbnail index
		let _thumbnailIndex = null;

		_thumbnailIndex = imagesObjSorted.findIndex(item => item.isThumbnail === true);

		this.thumbnailIndex = _thumbnailIndex === -1 ? 0 : _thumbnailIndex;

		// ---------------------
		// Product Assets
		// ---------------------

		this.productAssets$ = this.selectedProduct.productAssets;

		this.productAssetsFA = this.addResourceForm.get('step1').get('productAssets') as FormArray;
		// this.productAssets.clear();


		this.imagesFile = [];

		this.productAssets$.forEach(item => {
			this.productAssetsFA.push(this._formBuilder.group(item));
			this.imagesFile.push(null) // push imagesFile with null to defined now many array in imagesFile
		});

		// ---------------------
		// Product Inventories
		// ---------------------

		this.productInventories$ = this.selectedProduct.productInventories;
		this.productInventoriesFA = this.addResourceForm.get('step1').get('productInventories') as FormArray;
		// this.productInventories.clear();

		this.productInventories$.forEach(item => {
			this.productInventoriesFA.push(this._formBuilder.group(item));
		});


		// ---------------------
		// Category
		// ---------------------

		// Add the category
		this.selectedProduct.categoryId = this.selectedProduct.categoryId;

		// Update the selected product form
		this.addResourceForm.get('step1').get('categoryId').patchValue(this.selectedProduct.categoryId);

		//to get the details of catgeory and show the tier category
		this._inventoryService.getCategoriesById(this.selectedProduct.categoryId).subscribe((res: ProductCategory) => {
			this.selectedParentCategory = res.parentCategoryId;

		})

		// Sort the filtered categories, put selected category on top
		// First get selected array index by using this.selectedProduct.categoryId

		let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.selectedProduct.categoryId);
		// if selectedProductCategoryIndex < -1 // category not selected
		// if selectedProductCategoryIndex = 0 // category selected already in first element
		if (selectedProductCategoryIndex > 0) {
			// if index exists get the object of selectedProductCategory
			this.selectedProductCategory = this.filteredProductCategories[selectedProductCategoryIndex];
			// remove the object from this.filteredProductCategories
			this.filteredProductCategories.splice(selectedProductCategoryIndex, 1);
			// re add this.selectedProductCategory in front
			this.filteredProductCategories.unshift(this.selectedProductCategory);
		}

	}
	// This fuction used to sort object
	dynamicSort(property) {
		var sortOrder = 1;
		if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a, b) {
			/* next line works with strings and numbers, 
			* and you may want to customize it to your needs
			*/

			let aProp = a[property] ? a[property] : '';
			let bProp = b[property] ? b[property] : '';

			var result = (aProp.toLowerCase() < bProp.toLowerCase()) ? -1 : (aProp.toLowerCase() > bProp.toLowerCase()) ? 1 : 0;
			return (result * sortOrder);
		}
	}

	sortObjects(array) {
		array.sort(function (a, b) {
			return a.sequenceNumber - b.sequenceNumber;
		});
	}


	generateSku() {
		if (this.addResourceForm.get('step1').get('isVariants').value === true) {
			if ((this.addResourceForm.get('step1').get('name').value && !this.addResourceForm.get('step1').get('sku').value) ||
				(this.addResourceForm.get('step1').get('name').value.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '') === this.addResourceForm.get('sku').value)
			) {
				this.addResourceForm.get('step1').get('sku').patchValue(this.addResourceForm.get('step1').get('name').value.trim().toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, ''));
				this.checkinput.sku = true;
			}
		}
	}

	// --------------------------------------
	// Product Category Section
	// --------------------------------------

	/**
	 * Toggle the categories edit mode
	 */
	toggleCategoriesEditMode(): void {
		this.productCategoriesEditMode = !this.productCategoriesEditMode;
	}

	/**
	 * Filter category
	 *
	 * @param event
	 */
	filterCategories(event): void {
		// Get the value
		const value = event.target.value.toLowerCase();

		// Filter the categories
		this.filteredProductCategories = this.productCategories$.filter(category => category.name.toLowerCase().includes(value));
	}

	/**
	 * Filter category input key down event
	 *
	 * @param event
	 */
	filterCategoriesInputKeyDown(event): void {
		// Return if the pressed key is not 'Enter'
		if (event.key !== 'Enter') {
			return;
		}

		// If there is no category available...
		if (this.filteredProductCategories.length === 0) {
			//  // Create the category
			//  this.createCategory(event.target.value);

			//  // Clear the input
			//  event.target.value = '';

			//  // Return
			//  return;
		}

		// If there is a category...
		const category = this.filteredProductCategories[0];
		const isCategoryApplied = this.addResourceForm.get('step1').get('categoryId').value;

		// If the found category is already applied to the product...
		if (isCategoryApplied) {
			// Remove the category from the product
			this.removeCategoryFromProduct();
		}
		else {
			// Otherwise add the category to the product
			this.addCategoryToProduct(category);
		}
	}

	/**
	 * Create a new category
	 *
	 * @param title
	 */
	createCategory(name: string, parentCategoryId: string, thumbnailUrl: string): void {
		const category = {
			name,
			storeId: this.storeId$,
			parentCategoryId,
			thumbnailUrl
		};

		// Create category on the server
		this._inventoryService.createCategory(category)
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((response) => {

				// Add the category to the product
				this.addCategoryToProduct(response["data"]);
			});
	}

	/**
	 * Update the category title
	 *
	 * @param category
	 * @param event
	 */
	updateLocalCategoryTitle(category: ProductCategory, event): void {
		// Update the title on the category
		category.name = event.target.value;
	}

	updateServerCategoryTitle(category: ProductCategory, event): void {
		// Update the category on the server
		this._inventoryService.updateCategory(category.id, category)
			.pipe(debounceTime(300))
			.subscribe();
	}

	/**
	 * Delete the category
	 *
	 * @param category
	 */
	deleteCategory(category: ProductCategory): void {

		// Open the confirmation dialog
		const confirmation = this._fuseConfirmationService.open({
			title: 'Delete category',
			message: 'Are you sure you want to delete this category? This action cannot be undone!',
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
				// Delete the category from the server
				this._inventoryService.deleteCategory(category.id).subscribe();

				// Mark for check
				this._changeDetectorRef.markForCheck();
			}
		});
	}

	/**
	 * Add category to the product
	 *
	 * @param category
	 */
	addCategoryToProduct(category: ProductCategory): void {

		//to display the tier category
		this.selectedParentCategory = category.parentCategoryId;

		// Update the selected product form
		this.addResourceForm.get('step1').get('categoryId').patchValue(category.id);

		// Mark for check
		this._changeDetectorRef.markForCheck();
	}

	/**
	 * Remove category from the product
	 *
	 * @param category
	 */
	removeCategoryFromProduct(): void {

		// Update the selected product form
		this.addResourceForm.get('step1').get('categoryId').patchValue("");

		// Mark for check
		this._changeDetectorRef.markForCheck();
	}

	/**
	 * Toggle product category
	 *
	 * @param category
	 * @param change
	 */
	toggleProductCategory(category: ProductCategory, change: MatCheckboxChange): void {
		if (change.checked) {
			this.addCategoryToProduct(category);

			// --------------------------------
			// Reposition selected category
			// --------------------------------

			// Sort the filtered categories, put selected category on top
			// First get selected array index by using this.selectedProduct.categoryId
			let selectedProductCategoryIndex = this.filteredProductCategories.findIndex(item => item.id === this.addResourceForm.get('step1').get('categoryId').value);
			// if selectedProductCategoryIndex < -1 // category not selected
			// if selectedProductCategoryIndex = 0 // category selected already in first element
			if (selectedProductCategoryIndex > 0) {
				// if index exists get the object of selectedProductCategory
				this.selectedProductCategory = this.filteredProductCategories[selectedProductCategoryIndex];
				// remove the object from this.filteredProductCategories
				this.filteredProductCategories.splice(selectedProductCategoryIndex, 1);
				// re add this.selectedProductCategory in front
				this.filteredProductCategories.unshift(this.selectedProductCategory);
			}
		} else {
			this.removeCategoryFromProduct();
		}
	}

	/**
	 * Should the create category button be visible
	 *
	 * @param inputValue
	 */
	shouldShowCreateCategoryButton(inputValue: string): boolean {
		return !!!(inputValue === '' || this.productCategories$.findIndex(category => category.name.toLowerCase() === inputValue.toLowerCase()) > -1);
	}

	// --------------------------------------
	// Product Assets/Images Section
	// --------------------------------------

	/**
	 * Toggle the categories edit mode
	 */
	toggleImagesEditMode(): void {
		this.imagesEditMode = !this.imagesEditMode;
	}

	/**
	 * Upload avatar
	 *
	 * @param fileList
	 */
	uploadImages(fileList: FileList, images): Promise<void> {
		// Return if canceled
		if (!fileList.length) {
			return;
		}

		const allowedTypes = ['image/jpeg', 'image/png'];
		const file = fileList[0];

		// Return if the file is not allowed
		if (!allowedTypes.includes(file.type)) {
			return;
		}

		// Return and throw warning dialog if image filename is more than 100 characters
		if (fileList[0].name.length > 100) {
			this._fuseConfirmationService.open({
				title: 'The file name is too long',
				message: 'The file name cannot exceed 100 characters (including spaces).',
				icon: {
					show: true,
					name: 'heroicons_outline:exclamation',
					color: 'warning'
				},
				actions: {

					cancel: {
						label: 'OK',
						show: true
					},
					confirm: {
						show: false,
					}
				}
			});

			return;
		}


		// Return and throw warning dialog if image file size is big
		let maxSize = 1048576;
		var maxSizeInMB = (maxSize / (1024 * 1024)).toFixed(2);

		if (fileList[0].size > maxSize) {
			// Show a success message (it can also be an error message)
			const confirmation = this._fuseConfirmationService.open({
				title: 'Image size limit',
				message: 'Your uploaded image exceeds the maximum size of ' + maxSizeInMB + ' MB !',
				icon: {
					show: true,
					name: "image_not_supported",
					color: "warn"
				},
				actions: {

					cancel: {
						label: 'OK',
						show: true
					},
					confirm: {
						show: false,
					}
				}
			});
			return;
		}


		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (_event) => {
			// add new image
			if (!images.length === true) {
				this.images.push(reader.result);
				this.imagesFile.push(file);
				this.currentImageIndex = this.images.length - 1;

			}
			// replace current image
			else {
				this.images[this.currentImageIndex] = reader.result + "";
				this.imagesFile[this.currentImageIndex] = file;
				this.imagesToBeDeleted.push({ id: this.addResourceForm.get('step1').get('productAssets').value[this.currentImageIndex].id, index: this.currentImageIndex })

				this.imagesWithId[this.currentImageIndex] = { id: null, url: reader.result + "" }
			}

			// set as dirty to remove pristine condition of the form control
			this.addResourceForm.get('step1').markAsDirty();

			this.imagesEditMode = false;
			this._changeDetectorRef.markForCheck();
		}
	}

	/**
	 * Remove the image
	 */
	removeImage(): void {
		const index = this.currentImageIndex;

		// if (index === this.thumbnailIndex){

		//     this._fuseConfirmationService.open({
		//     title  : 'Reminder',
		//     message: 'You cannot delete a thumbnail image.',
		//     icon       : {
		//         show : true,
		//         name : 'heroicons_outline:exclamation',
		//         color: 'warning'
		//     },
		//     actions: {

		//         cancel: {
		//             label: 'OK',
		//             show: true
		//             },
		//         confirm: {
		//             show: false,
		//         }
		//         }
		//     });

		// }
		// else {


		// }
		if (index > -1) {
			this.images.splice(index, 1);
			this.imagesFile.splice(index, 1);
			this.currentImageIndex = 0;
			if (this.imagesWithId[index]) {

				this.imagesToBeDeleted.push({ id: this.imagesWithId[index].id, index: index })
			}
			this.imagesWithId.splice(index, 1);
		}

		if (this.images.length == 0) {
			this.thumbnailIndex = -1;
		}
		else if (this.images.length == 1) {
			this.thumbnailIndex = 0;
		}

		this._changeDetectorRef.markForCheck();

		// set as dirty to remove pristine condition of the form control
		this.addResourceForm.get('step1').markAsDirty();
	}

	/**
	 * Cycle through images of selected product
	 */
	cycleImages(forward: boolean = true): void {
		// Get the image count and current image index
		const count = this.images.length;
		const currentIndex = this.currentImageIndex;

		// Calculate the next and previous index
		const nextIndex = currentIndex + 1 === count ? 0 : currentIndex + 1;
		const prevIndex = currentIndex - 1 < 0 ? count - 1 : currentIndex - 1;

		// If cycling forward...
		if (forward) {
			this.currentImageIndex = nextIndex;
		}
		// If cycling backwards...
		else {
			this.currentImageIndex = prevIndex;
		}
	}

	resetCycleImages() {
		this.currentImageIndex = 0;
	}

	// --------------------------------------
	// Everything else
	// --------------------------------------

	/**
	 * Track by function for ngFor loops
	 *
	 * @param index
	 * @param item
	 */
	trackByFn(index: number, item: any): any {
		return item.id || index;
	}

	// Quil editor text limit
	textChanged($event) {
		const MAX_LENGTH = 500;
		if ($event.editor.getLength() > MAX_LENGTH) {
			$event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
		}
	}

	/**
	 * Update the selected product using the form data
	 */
	async updateResourceMethod(): Promise<void> {

		// Set loading to true
		this.isLoading = true;

		// Get store domain
		let storeFrontURL = 'https://' + this.store$.domain;

		const step1FormGroup = this.addResourceForm.get('step1') as FormGroup;

		// Get the product object
		const { sku, price, quantity, isCustomNote, ...product } = step1FormGroup.getRawValue();


		product.seoName = product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
		product.seoUrl = storeFrontURL + '/product/' + product.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
		product.name = product.name.trim();

		// Get the product object for updating the product
		const { productAssets, productInventories, productReviews, productVariants, ...productToUpdate } = product;

		let updateResource: Resource = {
			name: product.name.trim(),
			price: this.addResourceForm.get('step1').get('price').value,
			numberOfWeeksReservable: this.addResourceForm.get('step1').get('availableStock').value,
			status: this.addResourceForm.get('step1').get('status').value,
		}

		// Update the product on the server
		await this._inventoryService.updateProduct(this.selectedProduct.id, productToUpdate)
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe(async () => {

				// Show a success message
				this.showFlashMessage('success');


				// Set delay before closing the details window
				setTimeout(() => {

					// Set loading to false
					this.isLoading = false;

					// close the window
					//this.cancelAddProduct()

					// Mark for check
					this._changeDetectorRef.markForCheck();
				}, 1000);

			});
		console.log('update Resource', updateResource);
		await this._resourceService.updateResource(this.selectedResource.id, updateResource).pipe(takeUntil(this._unsubscribeAll))
			.subscribe(async () => {

				// Show a success message
				this.showFlashMessage('success');


				// Set delay before closing the details window
				setTimeout(() => {

					// Set loading to false
					this.isLoading = false;

					// close the window
					this.cancelAddProduct()

					// Mark for check
					this._changeDetectorRef.markForCheck();
				}, 1000);

			});


		// create image
		this.imagesFile.forEach((item, i) => {
			if (item) {
				let formData = new FormData();
				formData.append('file', this.imagesFile[i]);
				this._inventoryService.addProductAssets(this.selectedProduct.id, formData, (i === this.thumbnailIndex) ? { isThumbnail: true } : { isThumbnail: false })
					.pipe(takeUntil(this._unsubscribeAll))
					.subscribe((response) => {

						this.addResourceForm.get('step1').get('productAssets').value[i] = response;
						// Mark for check
						this._changeDetectorRef.markForCheck();
					});
			}
		})

		// update the image (only thumbnail)
		this.imagesWithId.forEach((asset, i) => {

			if (i === this.thumbnailIndex && asset.id) {

				let updateItemIndex = asset;
				updateItemIndex.isThumbnail = true;

				this._inventoryService.updateProductAssets(this.selectedProduct.id, updateItemIndex, asset.id)
					.pipe(takeUntil(this._unsubscribeAll))
					.subscribe((response) => {
						// Mark for check
						this._changeDetectorRef.markForCheck();
					});
			}

		})

		// Delete main product images
		for (let i = 0; i < this.imagesToBeDeleted.length; i++) {

			await this._inventoryService.deleteProductAssets(this.selectedProduct.id, this.imagesToBeDeleted[i].id).toPromise().then(data => {

				this.thumbnailIndex
				this._changeDetectorRef.markForCheck();
			});
		}


		// set the array to null
		//this.variantImagesToBeDeleted = [];
		this.imagesToBeDeleted = [];


	}


	cancelAddProduct() {
		this.selectedProduct = null;
		(this.addResourceForm.get('step1').get('productInventories') as FormArray).clear();
		(this.addResourceForm.get('step1').get('productVariants') as FormArray).clear();
		(this.addResourceForm.get('step1').get('productAssets') as FormArray).clear();
		this.dialogRef.close({ valid: false });

	}

	checkInput(input, event = null) {
		// check input
		if ((this.addResourceForm.get('step1').get(input) && this.addResourceForm.get('step1').get(input).value) ||
			(input === 'category' && event.target.checked)
		) {
			this.checkinput[input] = true;
		} else {
			this.checkinput[input] = false;
		}
	}

	setThumbnail(currentImageIndex: number) {
		this.thumbnailIndex = currentImageIndex;

		// set as dirty to remove pristine condition of the form control
		this.addResourceForm.get('step1').markAsDirty();

	}

	previewImage(file) {
		var promise = new Promise(async (resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (_event) => {
				resolve(reader.result)
			}
		});
		this._changeDetectorRef.markForCheck();
		return promise;

	}

	showFlashMessage(type: 'success' | 'error' | 'warning'): void {
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
	 * Delete the selected product using the form data
	 */
	deleteSelectedResource(): void {
		// Open the confirmation dialog
		const confirmation = this._fuseConfirmationService.open({
			title: 'Delete product',
			message: 'Are you sure you want to delete this product? This action cannot be undone!',
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

				this._resourceService.deleteResource(this.selectedResource.id).subscribe(() => {
					console.log("Called Resource");
					// Close the details
					this.cancelAddProduct();
				});

				// Delete the product on the server
				this._inventoryService.deleteProduct(this.selectedProduct.id).subscribe(() => {

					//  this.products$
					//      .pipe(take(1)) 
					//      .subscribe(products => {

					//          // filter after delete
					//          this.filterProductOptionsMethod(products);
					//      })
					console.log("Called Product");

					// Close the details
					//this.cancelAddProduct();
				});
			}
		});
	}


	/**
	 * 
	 * Check if the product name is already exists
	 * 
	 * @param value 
	 */
	async checkProductName(name: string) {



		// Check if the entered name is identical to the original name
		if (name.trim() !== this.selectedProduct.name.trim()) {

			let status = await this._inventoryService.getExistingProductName(name.trim());
			if (status === 409) {
				this.addResourceForm.get('step1').get('name').setErrors({ productAlreadyExists: true });
			}
		}

	}

	/**
	 * Return the value of product quantity
	 * 
	 * @param productInventories 
	 * @returns 
	 */
	totalInventories(productInventories: ProductInventory[] = []) {

		// if has variants
		if (productInventories.length > 1) {
			const quantity = productInventories.map(x => x.quantity)

			let total = quantity.reduce((acc, val) => acc + val)

			return total;

		}
		else if (productInventories.length === 1) {
			return productInventories[0].quantity;
		}
		else {
			return 0;
		}

	}
	setAvailability(e) {
		this.addResourceForm.get("step1").get("isAvailabilityToggle").setValue(e.checked);
	}

	createNewResourceAvailability() {

		let startTime = this.startTime;
		let endTime = this.endTime;
		let strStart = startTime.timeHour + ":" + startTime.timeMinute + " " + startTime.timeAmPm;
		let strEnd = endTime.timeHour + ":" + endTime.timeMinute + " " + endTime.timeAmPm;
		const convertTime = timeStr => {
			const [time, modifier] = timeStr.split(' ');
			let [hours, minutes] = time.split(':');
			if (hours === '12') {
				hours = '00';
			}
			if (modifier === 'PM') {
				hours = parseInt(hours, 10) + 12;
			}
			return `${hours}:${minutes}`;
		};
		let start24 = convertTime(strStart);
		let end24 = convertTime(strEnd);

		this.resourceAvailability = {
			startTime: start24,
			endTime: end24,
			durationInMinutes: this.durationInMinutes,
			offsetHours: this.offsetHours.offset,
			availabilityDay: this.availabilityDay,
			confirmationMethod: this.confirmationMethodStr
		}

		this._resourceService.createResourceAvailability(this.resourceAvailability, this.store$.id, this.selectedResource.id)
			.subscribe((response) => {
				/* this.newResourceAvailabilityId = newResource['data'].id;
				this.selectedResourceAvailability = newResource['data']; */

				this.storeDiscountTierList = this.addResourceForm.get('step2') as FormArray;

				// since backend give full discount tier list .. (not the only one that have been created only)
				//this.storeDiscountTierList.clear();

				this._listOfResourceAvailabilities.push(response['data']);
				
				this._listOfResourceAvailabilities.forEach(item => {
					this.storeDiscountTierList.push(this._formBuilder.group(item));
				});


				//disable button add
				this.isDisplayAddTier = false;
				//clear the input
				(<any>this.durationInMinutes) = '0';
				(<any>this.startTime) = '';
				(<any>this.endTime) = '';

				// Mark for check
				this._changeDetectorRef.markForCheck();

			});
	}

	validateAvailability(type: string, value) {
		if (type === "availabilityDay") {
			this.availabilityDay = value;
		}

		if (type === "startTime") {
			this.startTime = value;
		}

		if (type === "endTime") {
			this.endTime = value;
		}

		if (type === "offset") {
			this.offsetHours = value;
		}

		if (type === "durationInMinutes") {
			this.durationInMinutes = value;
		}

		if (type === "confirmationMethod") {
			this.confirmationMethodStr = value;
		}
	}

	// --------------------------------------
	//          Date and Time Section
	// --------------------------------------

	setValueToTimeSelector(discount) {

		//=======================================================
		//                      Start Time
		//=======================================================

		let _itemStartTimeHour = discount.startTime.split(":")[0];
		if (discount.startTime.split(":")[0] > 12) {
			_itemStartTimeHour = _itemStartTimeHour - 12;
			_itemStartTimeHour = ((_itemStartTimeHour < 10) ? '0' : '') + _itemStartTimeHour;
		}

		let _itemStartTimeMinute = discount.startTime.split(":")[1];

		let _itemStartTimeAMPM: 'AM' | 'PM';
		if (discount.startTime.split(":")[0] >= 12) {
			_itemStartTimeAMPM = "PM";
		} else {
			_itemStartTimeAMPM = "AM";
		}

		this.addResourceForm.get('step1.startTime').setValue(new TimeSelector(_itemStartTimeHour, _itemStartTimeMinute, _itemStartTimeAMPM));

		//=======================================================
		//                      End Time
		//=======================================================

		let _itemEndTimeHour = discount.endTime.split(":")[0];
		if (discount.endTime.split(":")[0] > 12) {
			_itemEndTimeHour = _itemEndTimeHour - 12;
			_itemEndTimeHour = ((_itemEndTimeHour < 10) ? '0' : '') + _itemEndTimeHour;
		}

		let _itemEndTimeMinute = discount.endTime.split(":")[1];

		let _itemEndTimeAMPM: 'AM' | 'PM';
		if (discount.endTime.split(":")[0] >= 12) {
			_itemEndTimeAMPM = "PM";
		} else {
			_itemEndTimeAMPM = "AM";
		}

		this.addResourceForm.get('step1.endTime').setValue(new TimeSelector(_itemEndTimeHour, _itemEndTimeMinute, _itemEndTimeAMPM));

		return;
	}

	checkDateTime(value) {
		// ==============================================================
		//                     Start Date & Time
		// ==============================================================

		// Get startTime
		let startTime = value;
		let _startTime;
		console.log("startTime__: ", startTime);

		if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
			_startTime = parseInt(startTime.timeHour) + 12;
		} else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
			_startTime = parseInt(startTime.timeHour) - 12;
			_startTime = (_startTime === 0) ? "00" : _startTime;
		} else {
			_startTime = startTime.timeHour;
		}

		// Set new start date and time
		const startDateTime = new Date();
		startDateTime.setHours(_startTime, startTime.timeMinute, 0)

		this.startTime = _startTime + ":" + startTime.timeMinute

		// ==============================================================
		//                      End Date
		// ==============================================================

		// Get endTime
		let endTime = value;
		let _endTime;

		if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
			_endTime = parseInt(endTime.timeHour) + 12;
		} else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
			_endTime = parseInt(endTime.timeHour) - 12;
			_endTime = (_endTime === 0) ? "00" : _endTime;
		} else {
			_endTime = endTime.timeHour;
		}

		// Set new end date and time
		const endDateTime = new Date();
		endDateTime.setHours(_endTime, endTime.timeMinute, 0)

		this.endTime = _endTime + ":" + endTime.timeMinute;
	}


	// updateSelectedDiscountTier(discountTier) {

	// 	// check condition first before pass to backend

	// 	if (discountTier.value.calculationType === 'PERCENT' && discountTier.value.discountAmount > 100) {

	// 		const confirmation = this._fuseConfirmationService.open({
	// 			title: 'Exceed maximum amount discount percentage',
	// 			message: 'Please change your discount amount for percentage calculation type',
	// 			actions: {
	// 				confirm: {
	// 					label: 'OK'
	// 				},
	// 				cancel: {
	// 					show: false,
	// 				}
	// 			}
	// 		});
	// 		this.storeDiscountTierListValueEditMode = [true];

	// 		return;
	// 	}

	// 	// Update the discount on the server
	// 	this._discountService.updateDiscountTier(discountTier.value.storeDiscountId, discountTier.value).subscribe(() => {
	// 		// Show a success message
	// 		this.showFlashMessage('success');
	// 	}, error => {
	// 		console.error(error);
	// 		if (error.status === 417) {
	// 			// Open the confirmation dialog
	// 			const confirmation = this._fuseConfirmationService.open({
	// 				title: 'Minimum subtotal overlap',
	// 				message: 'Your minimum subtotal entered overlapping with existing amount! Please change your minimum subtotal',
	// 				actions: {
	// 					confirm: {
	// 						label: 'OK'
	// 					},
	// 					cancel: {
	// 						show: false,
	// 					}
	// 				}
	// 			});
	// 		}
	// 	});
	// }

	updateSelectedResourceAvailability(resourceAvailability) {

		this._resourceService.updateResourceAvailability(resourceAvailability.value.id, resourceAvailability.value)
			.subscribe((response) => {
				this.showFlashMessage('success');
			},
				error => {
					console.log(error);
				});
	}

	deleteSelectedResourceAvailability(resourceAvailabilityId: string): void {
		// Open the confirmation dialog
		const confirmation = this._fuseConfirmationService.open({
			title: 'Delete Resource Availability',
			message: 'Are you sure you want to remove this resource availability? This action cannot be undone!',
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

				// Delete the discount on the server
				this._resourceService.deleteResourceAvailability(resourceAvailabilityId).subscribe(() => {

					this.storeDiscountTierList = this.addResourceForm.get('step2') as FormArray;

					let index = (this.storeDiscountTierList.value.findIndex(x => x.id === resourceAvailabilityId));

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


}
