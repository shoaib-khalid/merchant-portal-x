import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { merge, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { FlowBuilderService } from 'app/modules/merchant/social-media/flow-builder/flow-builder.service';
import { FlowBuilderPagination } from 'app/modules/merchant/social-media/flow-builder/flow-builder.types'
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';

import { BotSelectionDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/bot-selection-dialog/bot-selection-dialog.component';
import { FlowDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/flow-dialog/flow-dialog.component';
import { LoadingComponent } from 'app/modules/merchant/social-media/flow-builder/components/loading/loading.component';

import { saveAs } from 'file-saver';
import { HelperService } from 'app/modules/merchant/social-media/flow-builder/components/helpers/helper.service';
import { GraphHelper } from 'app/modules/merchant/social-media/flow-builder/components/helpers/graph-helper';
import { JsonCodec } from 'app/modules/merchant/social-media/flow-builder/components/helpers/json-codec';

// import { BotSelectionDialogComponent } from 'src/app/modules/flow-builder/components/bot-selection-dialog/bot-selection-dialog.component';
// import { Helper } from 'src/app/helpers/graph-helper';
// import { JsonCodec } from 'src/app/helpers/json-codec';
// import { saveAs } from 'file-saver';
// import { ApiCallsService } from "src/app/services/api-calls.service";
// import { MatDialog } from '@angular/material/dialog';
// import { HelperService } from 'src/app/services/helper.service';
// import { FlowDialog } from 'src/app/modules/flow-builder/components/flow-dialog/flow-dialog.component';
// import { HelperTextService } from 'src/app/helpers/helper-text.service';

declare var mxUtils: any;
declare var mxGraphHandler: any;
declare var mxEvent: any;
declare var mxUndoManager: any;
declare var mxOutline: any;

@Component({
    selector       : 'flow-builder',
    templateUrl    : './flow-builder.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowBuilderComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('graphContainer') graphContainer: ElementRef;
    @ViewChild('outlineContainer') outlineContainer: ElementRef;

    public anchorPosition: boolean = true;
    graph: any;
    triggers: any;
    redoPointer: any;
    opened: boolean;

    flowId: string;
    flowTitle: any = "Flow Title";
    flowDescription: any;
    loadingdialogRef: any;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _flowBuilderService: FlowBuilderService,
        private _helperService: HelperService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _route: ActivatedRoute,
        private _router: Router,
        private _dialog: MatDialog,

        private graphHelper: GraphHelper,
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
        this._route.params.subscribe(async params => {
            if (params.id) {

                this.flowId = params.id;
                this.retrieveJsonEndpoint();
            }
         });
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // setTimeout(() => {
            
        // }, 0);

        this.redoPointer = 0;

        //Callback function
        this.addStep = (x: any = 50, y: any = 0): any => {
           let vertext = this.graph.insertVertex(this.graph.getDefaultParent(), null, obj, x, y, 300, 200, "rounded=1;whiteSpace=wrap;autosize=0;resizable=0;opacity=0", null);
           vertext.setConnectable(false);
           var doc = mxUtils.createXmlDocument();
           var ConnectionStart = doc.createElement('ConnectionStart');
           var v11 = this.graph.insertVertex(vertext, null, ConnectionStart, 1, 1, 15, 15, "resizable=0;constituent=1;movable=0;strokeColor=none;opacity=0;port=1;", null);
           v11.geometry.offset = new mxPoint(-7, -45);
           v11.geometry.relative = true;
           v11.setConnectable(true);
           // this.configService.autoSaveAdd(JsonCodec.getIndividualJson(v11), "")
  
           var ConnectionStart = doc.createElement('ConnectionEnd');
           var v11 = this.graph.insertVertex(vertext, null, ConnectionStart, 0, 0, 20, 20, "resizable=0;constituent=1;movable=0;strokeColor=none;opacity=0;port=1;", null);
           v11.geometry.offset = new mxPoint(0, 45);
           v11.geometry.relative = true;
           v11.setConnectable(true);
           // this.configService.autoSaveAdd(JsonCodec.getIndividualJson(v11), "")
  
           this.graph.refresh();
  
           this.graphHelper.v1 = vertext;
           return vertext;
        }
        //End callback function
  
        //Graph configurations
        this.graph = new mxGraph(this.graphContainer.nativeElement);
        this.graph.keepEdgesInBackground = true;
        this.graphHelper.addAssets(this.graph);
  
        new mxOutline(this.graph, this.outlineContainer.nativeElement);
        mxGraphHandler.prototype.guidesEnabled = true;
  
        var undoManager = new mxUndoManager();
        this.graphHelper.actionOnEvents(this.graph);
        var listener = async (sender, evt) => {
  
           this.redoPointer++;
           undoManager.undoableEditHappened(evt.getProperty('edit'));
           try {
  
              // if (undoManager.history[undoManager.history.length - 1].changes[0].geometry) {
              //    //On vertex move json will be posted
              //    this.configService.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))
  
              // }
  
              //  if (undoManager.history[undoManager.history.length - 1].changes[0].parent === null) {
              //    this.configService.autoSaveDelete(JsonCodec.getIndividualJson(this.helper.v1))
              //    this.configService.data.forEach((element, index) => {
              //       if (element.vertexId == this.helper.v1.id) {
              //          this.configService.data.splice(index, 1)
              //       }
              //    });
              //    return
              // }
  
              const objJson = this.individualJson(undoManager.history[undoManager.history.length - 1].changes[0].child);
              // if (objJson.includes(`@edge":"1"`)) {
              //    this.configService.autoSaveAdd(objJson, "")
              // }
              // else if (objJson.includes(`"triggers":`)) {
              //    await this.configService.autoSaveAdd(objJson, "")
              //    this.configService.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))
              // }
              // else if (this.helper.copyAction) {
              //    this.configService.autoSaveAdd(objJson, "")
              //    this.configService.data.forEach((element, index) => {
              //       if (element.vertexId == this.helper.v1.id) {
              //          var len = 0;
              //          var parent = this.graph.getDefaultParent();
              //          var vertices = this.graph.getChildVertices(parent);
              //          for (var i = 0; i < vertices.length; i++) {
              //             len = len + (this.graph.getChildVertices(vertices[i])).length
              //          }
              //          this.configService.data.push({
              //             "type": element.type,
              //             "vertexId": String(vertices.length + 2 + len),
              //             "dataVariables": [
              //                {
              //                   "id": this.helperService.getLastId(),
              //                   "dataVariable": element.dataVariables[0].dataVariable,
              //                   "path": "",
              //                   "optional": ""
              //                }
              //             ]
              //          })
  
              //       }
              //    });
              //    this.helper.copyAction = false;
              // } else if (objJson.includes(`"conditions":{"@id"`)) {
              //    await this.configService.autoSaveAdd(objJson, "")
              //    this.configService.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))
              // }
  
  
           } catch (ex) { }
        };
  
        this.undo = () => {
           if (this.redoPointer > undoManager.history.length) {
              this.redoPointer = undoManager.history.length;
           }
  
           if (this.redoPointer < 1) {
              return;
           }
  
           try {
              if (undoManager.history[this.redoPointer - 1].changes[0].child.value === "Test") {
                 undoManager.undo();
                 undoManager.undo();
                 undoManager.undo();
                 this.redoPointer--;
                 this.redoPointer--;
                 this.redoPointer--;
  
              } else {
                 this.redoPointer--;
                 undoManager.undo();
              }
  
           } catch (ex) {
              this.redoPointer--;
              undoManager.undo();
           }
        }
        this.redo = () => {
           if (this.redoPointer > undoManager.history.length) {
              this.redoPointer = undoManager.history.length;
           }
  
           if (this.redoPointer < undoManager.history.length) {
  
              try {
  
                 if (undoManager.history[this.redoPointer].changes[0].child.value.localName === "UserObject") {
                    undoManager.redo();
                    this.redoPointer++;
  
  
                 } else {
                    undoManager.redo();
                    this.redoPointer++;
  
                 }
              } catch (ex) {
                 this.redoPointer++;
                 undoManager.redo();
              }
           }
        }
  
        this.graph.getModel().addListener(mxEvent.UNDO, listener);
        this.graph.getView().addListener(mxEvent.UNDO, listener);
        this.graph.connectionHandler.targetConnectImage = true;
        this.graphHelper.graphConfigurations(this.graph);
        this.graphHelper.setVertexStyle(this.graph);
  
        //For edge connections
        this.graph = this.graphHelper.connectPreview(this.graph);
  
        var doc = mxUtils.createXmlDocument();
        var obj = doc.createElement('UserObject');
        this.triggers = doc.createElement('triggers');

        this.graphHelper.customVertex(this.graph);
  
        this.graphHelper.setEdgeStyle(this.graph);
        new mxRubberband(this.graph);
        this.graph.getModel().beginUpdate();
        this.graph.foldingEnabled = false;
        this.graph.getModel().endUpdate();
        new mxHierarchicalLayout(this.graph).execute(this.graph.getDefaultParent());
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


    async retrieveJsonEndpoint() {

        try {
           var response: any = await this._flowBuilderService.retrieveGraph(this.flowId);
  
        } catch (ex) {
           console.log(ex)
        }
  
        this._flowBuilderService.data$ = response.data.data;
        let rawData = JSON.stringify({ mxGraphModel: response.data.mxGraphModel });
        JsonCodec.loadJson(this.graph, rawData)
        this.setFlowDetails();
  
     }

    addStep(x = 50, y = 0) { }

    zoomOut() { this.graph.zoomOut(); }
    zoomIn() { this.graph.zoomIn(); }
    addTrigger() { }
    undo() { }
    redo() { }
 
    individualJson(vertex) {
       let json = JsonCodec.getIndividualJson(vertex);
       return json;
 
    }
 
    getStartJson() {
       return JsonCodec.getJson(this.graph);
    }
 
    showJson() {
       let json = JsonCodec.getJson(this.graph);
       const blob = new Blob([json], { type: 'application/json' });
       saveAs(blob, 'chatbot-diagram.json');
 
    }

    loadJson(event) {
        let reader = new FileReader();
        if (event.target.files && event.target.files.length > 0) {
           let jsonFile = event.target.files[0];
           reader.readAsText(jsonFile);
  
           reader.onload = () => {
              JsonCodec.loadJson(this.graph, reader.result);
           };
        }
     }
  
    deleteMultipleVertices() { 
        this.graphHelper.deleteMultipleVertices(this.graph); 
    }

    copyMultipleVertices() {
        this.graphHelper.copyMultipleVertices(this.graph);
    }

    async publish() {
        const data = await this.getPublishFlowData(this.flowId)
        const dialogRef = this._dialog.open(BotSelectionDialogComponent, {
            width: '550px',
            data: data
        });
    }

    async getPublishFlowData(id) {
        const publishedChannels = [];
        var flows: any = await this._flowBuilderService.getAllflows();
        flows = flows.data;
        flows.forEach(element => {
        if (element.botIds) {
            publishedChannels.push({ flowid: element.id, channels: element.botIds })
        }
        });
        var channelIds: any = [];
        publishedChannels.forEach(element => {
        if (element.flowid == id) {
            channelIds = element.channels;
        }
        });
        return { flowId: id, channelsPublish: channelIds }
    }

    addStepWithType(type, x: any = 50, y: any = 0) {
        this.graphHelper.vertexType = type;
        const v1 = this.addStep(x, y);
        const length = this._flowBuilderService.data$.length;
        var lastId
        if (length > 0) {
            lastId = parseInt(this._flowBuilderService.data$[length - 1].dataVariables[0].id);
        } else {
            lastId = -1;
        }

        if (type === "ACTION") {
            this._flowBuilderService.data$.push({
                "type": type,
                "vertexId": this.graphHelper.v1.id,
                "actions": [],
                "dataVariables": [
                    {
                    "id": lastId + 1,
                    "dataVariable": "",
                    "path": "",
                    "optional": ""
                    }
                ]
            });
        } else if (type === "CONDITION") {
            this._flowBuilderService.data$.push({
                "type": type,
                "vertexId": this.graphHelper.v1.id,
                "conditions": [],
                "dataVariables": [
                    {
                    "id": lastId + 1,
                    "dataVariable": "",
                    "path": "",
                    "optional": ""
                    }
                ]
            });
        }
        else {
            this._flowBuilderService.data$.push({
                "type": type,
                "vertexId": this.graphHelper.v1.id,
                "buttons": [],
                "dataVariables": [
                    {
                    "id": lastId + 1,
                    "dataVariable": "",
                    "path": "",
                    "optional": ""
                    }
                ]
            });
        }

        console.log('-----------------------------------------')
        console.log(this._flowBuilderService.data$)
        // this._flowBuilderService.autoSaveAdd(JsonCodec.getIndividualJson(this.helper.v1), type)
        return v1;
    }

    editDetails() {
        const dialogRef = this._dialog.open(FlowDialogComponent, {
            width: '368px',
            data: { title: this.flowTitle, description: this.flowDescription, dialogTitle: "Edit flow details" }
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (result) {
                if (result[0] && result[1]) {
                    this.flowTitle = result[1];
                    this.flowDescription = result[0];
                    this._flowBuilderService.updateFlowDetails({
                    title: result[1],
                    description: result[0],
                    ownerId: localStorage.getItem("ownerId")
                    }, this.flowId);
                }
            }
        });
    }

    async setFlowDetails() {
        var flowDetails: any = await this._flowBuilderService.retrieveFlowDetails(this.flowId);
        this.flowTitle = flowDetails.data.title;
        this.flowDescription = flowDetails.data.description;
    }

    async save() {
        const newStartJson:any = this.getStartJson();
        const json = {
            "data": this._flowBuilderService.data$,
            "mxGraphModel": JSON.parse(newStartJson).mxGraphModel
        };

        this.loadingdialogRef = this._dialog.open(LoadingComponent, {
            disableClose: true,
            width: "250px",
            height: '130px',
            data: { message: "Updating..." }
        });

        const data = await this._flowBuilderService.postNewFlowDefaultJson(json, this.flowId)
        this.loadingdialogRef.close();
    }
}
