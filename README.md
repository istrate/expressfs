# expressfs is a Simple Static file server over http
You can use it to upload and download files

# Running expressfs locally 
1. You need to have nodejs installed
2. Clone repository
3. Run: 
    ``node app.js``

# Running expressfs in docker container 

1. Pull the image locally
   Pull this container with the following Podman command:
   ```bash
      podman pull quay.io/istrate/expressfs:1.0.0 
   ```
   Pull this container with the following Docker command:
   ```bash
      docker pull quay.io/istrate/expressfs:1.0.0 
   ```
2. Run image in container
  ```bash
     podman run -d -ti -p 8080:8080 quay.io/istrate/expressfs:1.0.0
  ```	 


