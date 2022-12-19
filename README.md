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

# Deploy in OpenShift 

Import below YAML definition. It will create a Deployment, Service and Route in `default` project. Route will be automatically generated. Change the values as per your need. Involved resources can be separately created as well. 
```yaml
---
kind: Deployment
apiVersion: apps/v1
metadata:  
  name: expressfs     
  namespace: default  
spec:
  replicas: 1
  selector:
    matchLabels:
      app: expressfs
  template:
    metadata:     
      labels:
        app: expressfs
        deploymentconfig: expressfs
    spec:
      containers:
        - name: expressfs
          image: quay.io/istrate/expressfs:1.0.0
          ports:
            - containerPort: 8080
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: Always
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      securityContext: {}
      schedulerName: default-scheduler
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  revisionHistoryLimit: 10
  progressDeadlineSeconds: 600
---
apiVersion: v1
kind: Service
metadata:
  name: expressfs
  namespace: default
spec:
  selector:
    app: expressfs
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: expressfs
  namespace: default
spec:
  path: /
  to:
    kind: Service
    name: expressfs
  port:
    targetPort: 8080
```
