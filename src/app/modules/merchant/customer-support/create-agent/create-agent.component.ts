import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'dialog-create-agent',
  templateUrl: './create-agent.component.html',

})
export class CreateAgentComponent implements OnInit {

  name: string = "";
  username: string = "";
  email: string = "";
  roleId: string ="";

  message: string = "";

  disabledProceed: boolean = true;
  checkname = false;

  constructor(
    public dialogRef: MatDialogRef<CreateAgentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatDialog
  ) { }

  ngOnInit(): void {
    //   console.log("disini pula", this.data)

      this.name = this.data["name"];
      this.username = this.data["username"];
      this.email = this.data["email"];
      this.roleId = this.data["roleId"]
  }

  addNewAgent() {
    this.dialogRef.close({ 
        status: true ,
        username: this.username,
        roleId : this.roleId
    });
  } 

  cancelCreateAgent(){
    this.dialogRef.close({ status: false });
  }

  checkName(){           
    // check discount name
    if (this.name) {
        this.checkname = true;
        this.message = "";
    }else{
        this.checkname = false;
        this.message = "Please insert discount name";
     }
    } 

    checkForm(){
        if (this.checkname === true ) {
            this.disabledProceed = false;
        } else {
            this.disabledProceed = true;
        }
        
    }
}
