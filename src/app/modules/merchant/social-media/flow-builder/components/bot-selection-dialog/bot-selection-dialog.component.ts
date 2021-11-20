import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
// import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-bot-selection-dialog',
  templateUrl: './bot-selection-dialog.component.html',
  styleUrls: ['./bot-selection-dialog.component.css']
})

export class BotSelectionDialogComponent implements OnInit {
  title: any = "Select Channel Types"
  bots: any = [];
  loading: boolean = true;
  checked: any = false;
  botIds: any = [];
  showPublished: boolean = false;
  flowId: any;
  channelsPublish: any;

  constructor(
    public dialogRef: MatDialogRef<BotSelectionDialogComponent>, 
    private _userService: UserService, 
    @Inject(MAT_DIALOG_DATA) public data: {
      channels: any;
      flowId: any;
      channelsPublish: any;
    }
  ) {
    if (data.channels) {
      this.showPublished = true;
      this.title = "Published Channels"
      this.loadPublishButtons(data.channels);
    } else {
      // this.loadPages()
      this.flowId = data.flowId;
      this.channelsPublish = data.channelsPublish;
      this.loadPublishButtons(null)
    }
  }

  ngOnInit(): void {
  }

  select(event) {

    document.getElementById("" + event.target.id).style.border = "3px solid black";
  }

  async loadPublishButtons(channels) {
    this.loading = true;
    this.bots = [];
    var data: any = await this._userService.getUserChannels();
    const content = data.data.content;
    console.log(content)

    var j = 0;
    for (var i = 0; i < content.length; i++) {

      if (channels) {
        if (channels[j] == content[i].refId) {
          this.bots.push({ channelName: content[i].channelName, refId: content[i].refId })
          j = j + 1;
        }
      } else {
        var flag = false;
        if (content[i].refId == this.channelsPublish[j]) {
          flag = true;
          j++;

        }
        this.bots.push({ channelName: content[i].channelName, refId: content[i].refId, published: flag })
      }
    }
    this.loading = false;
  }

  publish() {
    // this.apiCalls.publishmxGraph(this.botIds, this.flowId)
    this.dialogRef.close();

  }

  setAll(event, i) {
    if (event.checked) {
      this.botIds[i] = event.source.id
    } else {
      this.botIds.splice(i, 1);
    }
  }


  /**
 * This function shows connected fb pages in published channels
 * It fetches pages from facebook and then displays them with 
 * published channels
 */
  async loadPages() {
    if (localStorage.getItem("fb-user-accessToken")) {
      // this.apiCalls.loadingAnimation("Loading..")
      // this.apiCalls.loadFbPages().subscribe(data1 => {
      //   const pageList = data1.data;
      //   for (var i = 0; i < pageList.length; i++) {
      //     this.checkForConnectedPages(pageList[i])
      //   }
      // });
    }
  }

  checkForConnectedPages(page) {
    // this.apiCalls.checkFbPageConnection(page.id, page.access_token).subscribe(data => {
    //   var flag = true;
    //   for (var i = 0; i < data.data.length; i++) {
    //     if (data.data[i].id == environment.client_id) {
    //       flag = false;
    //     }
    //   }
    //   if (flag == false) {
    //     this.bots.push({ channelName: page.name, refId: page.id })
    //     console.log(page)
    //   }
    //   this.apiCalls.loadingdialogRef.close();
    // })
  }

}
