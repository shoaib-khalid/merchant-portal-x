import { Injectable } from '@angular/core';
import { FlowBuilderService } from '../../flow-builder.service';
// import { ApiCallsService } from './api-calls.service';
import { GraphHelper } from '../helpers/graph-helper';
@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor(
    private _flowBuilderService: FlowBuilderService,
    private _graphHelper: GraphHelper
  ) { }

  vertexClicked() {

    var vertextType;
    try {
      this._flowBuilderService.data$.forEach((element, index) => {

        if (element.vertexId === this._graphHelper.v1.id) {
          vertextType = element.type;
        }


      });
    } catch (ex) {
      return "";
    }
    return vertextType;
  }

  getLastId() {
    var lastId;
    const length = this._flowBuilderService.data$.length;
    if (length > 0) {
      lastId = parseInt(this._flowBuilderService.data$[length - 1].dataVariables[0].id);
    } else {
      lastId = -1;
    }
    return lastId + 1;
  }

  getVertexIndex() {
    var index1;
    this._flowBuilderService.data$.forEach((element, index) => {
      try {
        if (element.vertexId === this._graphHelper.v1.id) {
          index1 = index;
        }
      } catch (ex) {
        return null;
      }
    });
    return index1;
  }

  insertExternalRequest(externalRequest) {
    this._flowBuilderService.data$.forEach((element, index) => {
      if (element.vertexId === this._graphHelper.v1.id) {
        element.actions.push(externalRequest);
      }
    });
  }

  fetchExternalRequests() {
    var externalRequests;
    this._flowBuilderService.data$.forEach((element, index) => {
      if (element.vertexId === this._graphHelper.v1.id) {
        externalRequests = element.actions;
      }

    });
    return externalRequests;
  }

  setExternalRequest(externalRequest, i) {
    this._flowBuilderService.data$.forEach((element, index) => {
      if (element.vertexId === this._graphHelper.v1.id) {
        element.actions[i] = externalRequest;
      }
    });
  }

  getAllDataVariables() {
    var dataVariableNames = [];
    console.log(this._flowBuilderService.data$)
    this._flowBuilderService.data$.forEach(element => {

      if (element.type === "ACTION") {
        for (var j = 0; j < element.actions.length; j++) {
          for (var k = 0; k < element.actions[j].externalRequest.response.mapping.length; k++) {
            if (element.actions[j].externalRequest.response.mapping[k].dataVariable) {
              dataVariableNames.push(element.actions[j].externalRequest.response.mapping[k].dataVariable)
            }
          }
        }
      } else {
        for (var i = 0; i < element.dataVariables.length; i++) {
          const dataVariableName = element.dataVariables[i].dataVariable;
          if (dataVariableName) {
            dataVariableNames.push(dataVariableName)
          }
        }
      }
    });
    return dataVariableNames;
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

  /**
   * Takes input characters that only accepts numbers, decimals
   * and commas.
   * Returns text without commas.
   */
  acceptCustomPrice(price) {
    price = price.replace(/[^\d.-/,/]+/g, '') // remove all non-digits except - and .
      .replace(/^([^.]*\.)|\./g, '$1') // remove all dots except first one
      .replace(/(?!^)-/g, '') // remove all hyphens except first one
    price = this.removeMoreThanOneCommas(price);
    return price
  }

  /**
   * Takes input string and removes commas from it.
   * Returns string without commas
   */
  removeCharacters(text) {
    text = text.toString();
    if (text) {

    } else {
      text = "0";
    }
    text = parseFloat(text.replace(/,/g, ''))
    text = text.toString();
    return text;
  }

  /**
   * 
   * @param price 
   * @returns text from which consecutive commas, dots, commas and dots, dots and commas have been removed.
   */
  removeMoreThanOneCommas(price) {
    if (price[0] == "," && !price.includes(",,")) {
      price = price.substring(1)
    } else if (
      price.includes(",,") ||
      price.includes(",.") ||
      price.includes(".,")) {
      var priceLatest = price[0];
      for (var i = 1; i < price.length; i++) {
        if (
          (price[i - 1] == "," && price[i] == ",") ||
          (price[i - 1] == "," && price[i] == ".") ||
          (price[i - 1] == "." && price[i] == ",")) {
        } else {
          priceLatest = priceLatest + price[i];
        }
      }
      return priceLatest;
    }
    return price;
  }

}
