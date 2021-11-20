import { Component } from '@angular/core';
import { JsonCodec } from 'app/modules/merchant/social-media/flow-builder/components/helpers/json-codec';
import { GraphHelper } from 'app/modules/merchant/social-media/flow-builder/components/helpers/graph-helper';
import { HelperService } from 'app/modules/merchant/social-media/flow-builder/components/helpers/helper.service';
import { FlowBuilderService } from 'app/modules/merchant/social-media/flow-builder/flow-builder.service';

@Component({
  selector: 'side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNav {
  opened: boolean;
  buttonsArray: any = [];
  pinned: boolean = false;
  title: any;
  triggerText: any;
  dataVariable: any = "";
  description: any = "";
  show: any = false;
  btnValues: any = []
  btnIndex: any = 0;
  btnValue: any = "";
  placeholderValue = "New Button";


  constructor(
    private _flowBuilderService: FlowBuilderService, 
    private _helperService: HelperService,

    private helper: GraphHelper, 
  ) {
  }

  toggle() {
    this.description = this.getDescriptionOfVertex();
    this.dataVariable = "";
    this._flowBuilderService.data$.forEach((element, index) => {
      if (element.vertexId == this.helper.v1.id) {
        this.dataVariable = element.dataVariables[0].dataVariable;
      }
    });

    if (this.opened) {
      this.updateButtons();
      this.updateButtonValues();
      this.btnValue = "";
      this.show = false;
    } else {
      this.opened = true;
      this.show = false;
      this.updateButtons();
      this.btnValue = "";
      this.updateButtonValues();

    }

  }

  insertButton() {
    // this.show = true;
    if (this.buttonsArray.length === 0) {
      this.updateDataVariableArray();
    }
    if(this.buttonsArray.length>2){
      return;
    }
    this.buttonsArray.push("New Button");
    this.btnValues.push({ btnTitle: "New Button", btnValue: "" });
    this.btnValue = "";
    this.btnIndex = this.buttonsArray.length - 1;
    this.helper.addTriggerUsingSidePanel();
  }

  pin() {
    if (this.pinned) {
      this.pinned = false;
      alert("Unpinned")
    } else {
      this.pinned = true;
      alert("Pinned")
    }
  }


  digitFromString(str) {
    const digit = parseInt(str.match(/(\d+)/));
    return String(digit);
  }
  handleClick(event) {
    if (this._helperService.vertexClicked() === "TEXT_MESSAGE" || this._helperService.vertexClicked() === "MENU_MESSAGE") {
      if (event.target.id.includes("header") || event.target.id.includes("card")) {
        var id = event.target.id;
        // console.log(id)
        id = this.digitFromString(id);
        // console.log(id)
        var text: any = document.getElementById(`header${id}`);
        text = text.innerHTML;
        // console.log(`header${id}`);
        (<HTMLInputElement>document.getElementById("vertex-title")).value = text;
        this.toggle();
      } else if (event.target.localName === "svg") {
        if (this.pinned === false) {
          this.opened = false;
          this.show = false;
        }
      }
    } else {
      this.opened = false;
      this.show = false;
    }
  }

  titleChange(text) {

    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    document.getElementById("header" + digit).textContent = text;

  }
  triggerTextChange(event, index) {
    this.btnValues[index].btnTitle = event.target.value;
    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    var arr = document.getElementsByClassName('customTrigger' + digit);
    if (event.target.value === "") {
      arr[index].textContent = "_"

    } else {

      arr[index].textContent = event.target.value;

    }
  }


  getStrDigit() {
    if (this.helper.v1.div.firstChild.id) {
      return this.helper.v1.div.firstChild.id;
    } else {
      return this.helper.v1.div.firstChild.nextElementSibling.id;
    }
  }

  triggerFocusOut(event, i) {
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1.children[i + 2]))
  }

  titleFocusOut(event) {
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

  }

  descriptionFocusOut(event) {
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

  }

  descriptionChange(event) {
    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    document.getElementById("initial-message" + digit).textContent = event.target.value;
  }



  dataVariableChange(event) {

  }

  dataVariableFocusOut(event) {
    const vertexId = this.helper.v1.id;
    const dataValue = event.target.value
    const length = this._flowBuilderService.data$.length;
    var lastId;
    if (length > 0) {
      lastId = parseInt(this._flowBuilderService.data$[length - 1].dataVariables[0].id);
    } else {
      lastId = -1;
    }
    var flag = false;
    for (var i = 0; i < length; i++) {
      if (this._flowBuilderService.data$[i].vertexId === vertexId) {
        this._flowBuilderService.data$[i].dataVariables[0].dataVariable = dataValue;
        flag = true;
      }
    }
    if (!flag) {
      this._flowBuilderService.data$.push({
        "vertexId": vertexId,
        "dataVariables": [
          {
            "id": lastId + 1,
            "dataVariable": dataValue,
            "path": "",
            "optional": ""
          }
        ]
      })

    }
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

  }
  getDescriptionOfVertex() {
    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    return document.getElementById("initial-message" + digit).textContent;
  }

  updateButtons() {
    const triggers = this.helper.v1.children.filter(v => v.value.nodeName == "triggers");
    if (this.helper.isVertex) {
      this.buttonsArray = [];
      try {
        for (var i = 0; i < (triggers.length); i++) {
          this.buttonsArray.push(String(triggers[i].div.innerText))
        }
      } catch (ex) {
      }
    }
  }

  updateDataVariableArray() {
    this._flowBuilderService.data$.forEach((element, index) => {
      if (element.vertexId == this.helper.v1.id) {
        element.type = "MENU_MESSAGE";
      }
    });
  }

  showValue() {
    this.show = true;
  }

  btnTitleFocus(event, i) {
    this.btnIndex = i;
    this.btnValue = this.btnValues[i].btnValue;
    this.placeholderValue = this.btnValues[i].btnTitle + " Value";
    this.show = true;
  }

  btnValueChange(event) {
    this.btnValues[this.btnIndex].btnValue = event.target.value;
  }

  btnValueMouseOut() {
    // Send updated buttons array
    var vertexIndex = this._helperService.getVertexIndex();
    this._flowBuilderService.data$[vertexIndex].buttons = this.btnValues;
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

  }


  updateButtonValues() {
    var vertexIndex = this._helperService.getVertexIndex();
    this.btnValues = this._flowBuilderService.data$[vertexIndex].buttons;
  }

  deleteTriggers(i) {
    this.buttonsArray.splice(i, 1)
    this.helper.deleteTriggerUsingSidePanel(i);
  }


}