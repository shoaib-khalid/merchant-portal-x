import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GenerateJwt {

    /**
     * Constructor
     */
    constructor(
    )
    {        
    }

    generate(header,role,token) {

        const HMACSHA256 = (stringToSign, secret) => "not_implemented"

        // The header typically consists of two parts: 
        // the type of the token, which is JWT, and the signing algorithm being used, 
        // such as HMAC SHA256 or RSA.

        const encodedHeaders = btoa(JSON.stringify(header))
        
        
        // The second part of the token is the payload, which contains the claims.
        // Claims are statements about an entity (typically, the user) and 
        // additional data. There are three types of claims: 
        // registered, public, and private claims.
        const claims = {
            "role": role
        }
        const encodedPlayload = btoa(JSON.stringify(claims))
        
        
        // create the signature part you have to take the encoded header, 
        // the encoded payload, a secret, the algorithm specified in the header, 
        // and sign that.
        const signature = HMACSHA256(`${encodedHeaders}.${encodedPlayload}`, token)
        const encodedSignature = btoa(signature)
        
        const jwt = `${encodedHeaders}.${encodedPlayload}.${encodedSignature}`
        console.log({jwt})

        return jwt;
    }
}