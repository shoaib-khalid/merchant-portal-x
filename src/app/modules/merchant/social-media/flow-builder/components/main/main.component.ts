import { AfterViewInit, Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GraphHelper } from 'app/modules/merchant/social-media/flow-builder/components/helpers/graph-helper';
import { JsonCodec } from 'app/modules/merchant/social-media/flow-builder/components/helpers/json-codec';
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from 'app/modules/merchant/social-media/flow-builder/components/helpers/helper.service';
import { BotSelectionDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/bot-selection-dialog/bot-selection-dialog.component';
import { FlowDialogComponent } from 'app/modules/merchant/social-media/flow-builder/components/flow-dialog/flow-dialog.component';
import { FlowBuilderService } from '../../flow-builder.service';

declare var mxUtils: any;
declare var mxGraphHandler: any;
declare var mxEvent: any;
declare var mxUndoManager: any;
declare var mxOutline: any;

@Component({
   selector: 'app-root',
   templateUrl: './main.component.html',
   styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit, AfterViewInit {
   @ViewChild('graphContainer') graphContainer: ElementRef;
   @ViewChild('outlineContainer') outlineContainer: ElementRef;

   public anchorPosition: boolean = true;
   graph: any;
   triggers: any;
   redoPointer: any;
   opened: boolean;

   flowId: string;
   flowTitle: any = "";
   flowDescription: any;
   constructor(
      private helperService: HelperService,
      private _graphHelper: GraphHelper,
      private route: ActivatedRoute,
      private _flowBuilderService: FlowBuilderService,
      public dialog: MatDialog,
   ) {
   }

   ngOnInit() {
      this.route.params.subscribe(params => {
         if (params.id) {
            this.flowId = params.id;
            this.retrieveJsonEndpoint();

         }
      });
   }

   ngAfterViewInit() {
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

         this._graphHelper.v1 = vertext;
         return vertext;
      }
      //End callback function

      //Graph configurations
      this.graph = new mxGraph(this.graphContainer.nativeElement);
      this.graph.keepEdgesInBackground = true;
      this._graphHelper.addAssets(this.graph);

      new mxOutline(this.graph, this.outlineContainer.nativeElement);
      mxGraphHandler.prototype.guidesEnabled = true;

      var undoManager = new mxUndoManager();
      this._graphHelper.actionOnEvents(this.graph);
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
      this._graphHelper.graphConfigurations(this.graph);
      this._graphHelper.setVertexStyle(this.graph);

      //For edge connections
      this.graph = this._graphHelper.connectPreview(this.graph);

      var doc = mxUtils.createXmlDocument();
      var obj = doc.createElement('UserObject');
      this.triggers = doc.createElement('triggers');
      this._graphHelper.customVertex(this.graph);

      this._graphHelper.setEdgeStyle(this.graph);
      new mxRubberband(this.graph);
      this.graph.getModel().beginUpdate();
      this.graph.foldingEnabled = false;
      this.graph.getModel().endUpdate();
      new mxHierarchicalLayout(this.graph).execute(this.graph.getDefaultParent());
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

   deleteMultipleVertices() { this._graphHelper.deleteMultipleVertices(this.graph); }

   copyMultipleVertices() {
      this._graphHelper.copyMultipleVertices(this.graph);
   }

   async retrieveJsonEndpoint() {

      try {
         var data: any = await this._flowBuilderService.retrieveGraph(this.flowId);

      } catch (ex) {
         console.log(ex)
      }

      this._flowBuilderService.data$ = data.data.data;
      data = JSON.stringify({ mxGraphModel: data.data.mxGraphModel });
      JsonCodec.loadJson(this.graph, data)
      this.setFlowDetails();

   }

   async publish() {
      const data = await this.helperService.getPublishFlowData(this.flowId)
      const dialogRef = this.dialog.open(BotSelectionDialogComponent, {
         width: '550px',
         data: data
      });
   }
   addStepWithType(type, x: any = 50, y: any = 0) {
      this._graphHelper.vertexType = type;
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
            "vertexId": this._graphHelper.v1.id,
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
            "vertexId": this._graphHelper.v1.id,
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
            "vertexId": this._graphHelper.v1.id,
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
      // this.configService.autoSaveAdd(JsonCodec.getIndividualJson(this.helper.v1), type)
      return v1;
   }

   editDetails() {
      const dialogRef = this.dialog.open(FlowDialogComponent, {
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
      // this.configService.loadingAnimation("Updating...")
      const data = await this._flowBuilderService.postNewFlowDefaultJson(json,this.flowId)
      // this.configService.loadingdialogRef.close();
   }
}