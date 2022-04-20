export class ValidateOauthRequest {
    country:	string;
    email:      string;
    loginType:  string;
    name?:      string;
    token:      string;
    userId?:    string;
} 

export enum SocialLooginClientId {
    // GOOGLE_CLIENT_ID =  '905470792335-krfa0c32ajed37ktrn16ggj3km0783rd.apps.googleusercontent.com',
    GOOGLE_CLIENT_ID =  '934035766455-vv63m7qps417r5fdbvmqrp7g0i8nvc02.apps.googleusercontent.com',
    FACEBOOK_CLIENT_ID =  '2915126152079198',                  // 'clientId'   // '283489330438468'      // '2915126152079198'
    APPLE_CLIENT_ID = 'my.deliverin.symplified.service',
}

export enum AppleConfiguration {
    scope = 'name email',
    // redirectURI = '/clients/applecallback',
    redirectURI = '',
    state = 'init',
} 
