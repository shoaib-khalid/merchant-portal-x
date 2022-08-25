To run this project correctly on local:

1. Add a url for a store on your hosts file that redirects to "127.0.0.1". For example:

```
127.0.0.1   merchant.symplified.localhost
127.0.0.1   merchant.easydukan.localhost
```

2. Start the server with the command:

```
ng s --host 0.0.0.0 --disable-host-check --port [portnumber]
```

3. Open the url which you added to the hosts file, in your browser with the port number. Like so:

```
http://merchant.symplified.localhost:[portnumber]/

OR

http://merchant.easydukan.localhost:[portnumber]/
```
