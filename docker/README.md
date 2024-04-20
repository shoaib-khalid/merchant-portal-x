# Important Note

This `docker-compose.yaml` is used for deployment `ONLY`. For building docker images, use `docker-compose.yaml` in parent directory

## Create a working directory
In below example we'll use `/home/user/services` as working directory. If directory `services` does not exists, `create` the directory.
```bash
$ pwd
/home/user/services
```

Create a directory (if not exists). We recommend to use same same convention as project name
```bash
$ mkdir merchant-portal-x
$ cd merchant-portal-x
$ pwd
/home/user/services/merchant-portal-x
```

## Rename .env.example to .env
```bash
$ mv .env.example .env
```

## Edit merchant-portal-x version
```env
APP_VERSION=0.1.0 # change to preferred version
```