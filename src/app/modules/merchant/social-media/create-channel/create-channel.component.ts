import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JwtService } from 'app/core/jwt/jwt.service';

@Component({
  selector: 'dialog-create-channel',
  templateUrl: './create-channel.component.html'
})
export class CreateChannelComponent implements OnInit {
  
    disabledProceed: boolean = true;
    checkname = false;
    checkrefId = false;
    checktoken = false;

    status: string;
    id: string;
    refId: string;
    userId: string;
    channelName: string;
    token: string;
  
    message: string = "";
    referenceId: any;
  
  constructor(
    public dialogRef: MatDialogRef<CreateChannelComponent>,
    private _jwt: JwtService,
  ) { }

// -----------------------------------------------------------------------------------------------------
// @ Accessors
// -----------------------------------------------------------------------------------------------------

  get accessToken(): string
  {
      return localStorage.getItem('accessToken') ?? '';
  }

// -----------------------------------------------------------------------------------------------------
// @ Lifecycle hooks
// -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
  }

// -----------------------------------------------------------------------------------------------------
// @ Public methods
// -----------------------------------------------------------------------------------------------------  

  addNewChannel() {
    this.dialogRef.close({ 
        status: true ,
        id: this.id,
        refId: this.refId,
        userId: this.userId,
        channelName: this.channelName,
        token: this.token
    });
  }
  cancelCreateChannel(){
    this.dialogRef.close({ status: false });
  }

  checkName(){
        //check name
        if (this.channelName){
            this.checkname = true;
            this.message = ""
        }else{
            this.checkname = false;
            this.message = "Please select channel option"
        }
    } 

//     checkRefId(){           
//         // check discount name
//         if (this.refId) {
//             this.checkrefId = true;
//             this.message = "";
//         }else{
//             this.checkrefId = false;
//             this.message = "Please insert reference Id";
//         }
//     }
    
//     checkToken(){           
//         // check discount name
//         if (this.token) {
//             this.checktoken = true;
//             this.message = "";
//         }else{
//             this.checktoken = false;
//             this.message = "Please insert token";
//         }
//     }

    checkForm(){
        if (this.checkname === true && this.checkrefId === true && this.checktoken === true) {
            this.disabledProceed = false;
        } else {
            this.disabledProceed = true;
        }
        
    }

    fbLogin(){
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        window.open(`https://www.facebook.com/login.php?skip_api_login=1&api_key=2915126152079198&kid_directed_site=0&app_id=2915126152079198&signed_next=1&next=https%3A%2F%2Fwww.facebook.com%2Fv10.0%2Fdialog%2Foauth%3Fapp_id%3D2915126152079198%26cbt%3D1638180401950%26channel_url%3Dhttps%253A%252F%252Fstaticxx.facebook.com%252Fx%252Fconnect%252Fxd_arbiter%252F%253Fversion%253D46%2523cb%253Df39e3c3c8467cfc%2526domain%253Dsymplified.it%2526is_canvas%253Dfalse%2526origin%253Dhttps%25253A%25252F%25252Fsymplified.it%25252Ff26ca6f9145349c%2526relation%253Dopener%26client_id%3D2915126152079198%26display%3Dpopup%26domain%3Dsymplified.it%26e2e%3D%257B%257D%26fallback_redirect_uri%3Dhttps%253A%252F%252Fsymplified.it%252Fmerchant%252Fuser-channels%26locale%3Den_GB%26logger_id%3Df5f7fbfcaa1ff4%26origin%3D1%26redirect_uri%3Dhttps%253A%252F%252Fstaticxx.facebook.com%252Fx%252Fconnect%252Fxd_arbiter%252F%253Fversion%253D46%2523cb%253Df135f1c64d83b74%2526domain%253Dsymplified.it%2526is_canvas%253Dfalse%2526origin%253Dhttps%25253A%25252F%25252Fsymplified.it%25252Ff26ca6f9145349c%2526relation%253Dopener%2526frame%253Df1f660364a9737c%26response_type%3Dtoken%252Csigned_request%252Cgraph_domain%26scope%3D%255B%2522public_profile%2522%252C%2522email%2522%252C%2522pages_messaging%2522%252C%2522pages_messaging_subscriptions%2522%252C%2522pages_manage_metadata%2522%255D%26sdk%3Djoey%26version%3Dv10.0%26ret%3Dlogin%26fbapp_pres%3D0%26tp%3Dunspecified&cancel_url=https%3A%2F%2Fstaticxx.facebook.com%2Fx%2Fconnect%2Fxd_arbiter%2F%3Fversion%3D46%23cb%3Df135f1c64d83b74%26domain%3Dsymplified.it%26is_canvas%3Dfalse%26origin%3Dhttps%253A%252F%252Fsymplified.it%252Ff26ca6f9145349c%26relation%3Dopener%26frame%3Df1f660364a9737c%26error%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied&display=popup&locale=en_GB&pl_dbl=0=2915126152079198&autoLogAppEvents=1`,'popup','width=600,height=600')
        this.dialogRef.close();
    }

    teleLogin(){
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const s = window.open(`https://tgo.symplified.biz/bottoken?userid=${clientId}`,'popup','width=600,height=600')
        var timer = setInterval(()=> { 
          if(s.closed) {
              clearInterval(timer);
              location.reload()
          }
      }, 500);
    }
}
