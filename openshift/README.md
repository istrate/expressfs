# OpenShift Deployment Guide for ExpressFS

This guide provides detailed instructions for deploying ExpressFS on OpenShift Container Platform.

## Prerequisites

- OpenShift CLI (`oc`) installed and configured
- Access to an OpenShift cluster
- Docker image pushed to a container registry (e.g., Quay.io, Docker Hub)
- Appropriate permissions to create resources in your namespace

## Quick Deployment

### Option 1: Deploy All Resources at Once

```bash
oc apply -f openshift/expressfs-deployment.yaml
```

This will create:
- Deployment
- Service
- Route
- PersistentVolumeClaim (10Gi)

### Option 2: Step-by-Step Deployment

#### 1. Create a New Project (Optional)

```bash
oc new-project expressfs
```

Or use an existing project:

```bash
oc project your-project-name
```

#### 2. Create Persistent Volume Claim

```bash
oc apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: expressfs-pvc
  labels:
    app: expressfs
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
EOF
```

#### 3. Create Deployment

```bash
oc apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expressfs
  labels:
    app: expressfs
    version: "2.0.0"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: expressfs
  template:
    metadata:
      labels:
        app: expressfs
        version: "2.0.0"
    spec:
      containers:
        - name: expressfs
          image: quay.io/istrate/expressfs:2.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              protocol: TCP
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "8080"
            - name: HOST
              value: "0.0.0.0"
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
            requests:
              memory: "256Mi"
              cpu: "250m"
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 3
          readinessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
          volumeMounts:
            - name: store-volume
              mountPath: /app/store
      volumes:
        - name: store-volume
          persistentVolumeClaim:
            claimName: expressfs-pvc
EOF
```

#### 4. Create Service

```bash
oc apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: expressfs
  labels:
    app: expressfs
spec:
  selector:
    app: expressfs
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
      name: http
  type: ClusterIP
EOF
```

#### 5. Create Route

```bash
oc apply -f - <<EOF
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: expressfs
  labels:
    app: expressfs
spec:
  path: /
  to:
    kind: Service
    name: expressfs
    weight: 100
  port:
    targetPort: http
  wildcardPolicy: None
EOF
```

## Verification

### Check Deployment Status

```bash
# Check all resources
oc get all -l app=expressfs

# Check deployment
oc get deployment expressfs

# Check pods
oc get pods -l app=expressfs

# Check service
oc get svc expressfs

# Check route
oc get route expressfs
```

### View Logs

```bash
# Get pod name
POD_NAME=$(oc get pods -l app=expressfs -o jsonpath='{.items[0].metadata.name}')

# View logs
oc logs $POD_NAME

# Follow logs
oc logs -f $POD_NAME
```

### Access the Application

```bash
# Get the route URL
oc get route expressfs -o jsonpath='{.spec.host}'

# Or open in browser
oc get route expressfs -o jsonpath='{"https://"}{.spec.host}{"\n"}'
```

## Configuration

### Environment Variables

You can customize the deployment by modifying environment variables:

```bash
oc set env deployment/expressfs \
  NODE_ENV=production \
  PORT=8080 \
  MAX_FILE_SIZE=104857600
```

### Scaling

Scale the deployment:

```bash
# Scale up
oc scale deployment/expressfs --replicas=3

# Scale down
oc scale deployment/expressfs --replicas=1
```

### Resource Limits

Update resource limits:

```bash
oc set resources deployment/expressfs \
  --limits=cpu=1000m,memory=1Gi \
  --requests=cpu=500m,memory=512Mi
```

### Storage

Increase storage size (if supported by storage class):

```bash
oc patch pvc expressfs-pvc -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'
```

## Updating the Application

### Update Image

```bash
# Update to new version
oc set image deployment/expressfs expressfs=quay.io/istrate/expressfs:2.1.0

# Check rollout status
oc rollout status deployment/expressfs

# View rollout history
oc rollout history deployment/expressfs
```

### Rollback

```bash
# Rollback to previous version
oc rollout undo deployment/expressfs

# Rollback to specific revision
oc rollout undo deployment/expressfs --to-revision=2
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod
oc describe pod -l app=expressfs

# Check events
oc get events --sort-by='.lastTimestamp'

# Check pod logs
oc logs -l app=expressfs --tail=100
```

### Storage Issues

```bash
# Check PVC status
oc get pvc expressfs-pvc

# Describe PVC
oc describe pvc expressfs-pvc

# Check if PV is bound
oc get pv
```

### Network Issues

```bash
# Test service connectivity
oc run test-pod --image=busybox --rm -it --restart=Never -- wget -O- http://expressfs

# Check service endpoints
oc get endpoints expressfs

# Describe service
oc describe svc expressfs
```

### Route Issues

```bash
# Check route details
oc describe route expressfs

# Test route
curl -I https://$(oc get route expressfs -o jsonpath='{.spec.host}')
```

## Security Considerations

### Using Secrets for Configuration

Create a secret for sensitive configuration:

```bash
oc create secret generic expressfs-config \
  --from-literal=max-file-size=104857600

# Use in deployment
oc set env deployment/expressfs --from=secret/expressfs-config
```

### Network Policies

Create network policy to restrict access:

```bash
oc apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: expressfs-netpol
spec:
  podSelector:
    matchLabels:
      app: expressfs
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector: {}
      ports:
        - protocol: TCP
          port: 8080
EOF
```

## Monitoring

### Health Checks

The deployment includes:
- **Liveness Probe**: Checks if the application is running (every 30s)
- **Readiness Probe**: Checks if the application is ready to serve traffic (every 10s)

### Resource Usage

```bash
# Check resource usage
oc adm top pods -l app=expressfs

# Check node resource usage
oc adm top nodes
```

## Backup and Restore

### Backup Uploaded Files

```bash
# Get pod name
POD_NAME=$(oc get pods -l app=expressfs -o jsonpath='{.items[0].metadata.name}')

# Backup files
oc rsync $POD_NAME:/app/store ./backup/

# Or use PVC backup if available
oc get pvc expressfs-pvc -o yaml > expressfs-pvc-backup.yaml
```

### Restore Files

```bash
# Restore files to pod
oc rsync ./backup/ $POD_NAME:/app/store/
```

## Cleanup

### Delete All Resources

```bash
# Delete all resources
oc delete -f openshift/expressfs-deployment.yaml

# Or delete individually
oc delete deployment expressfs
oc delete service expressfs
oc delete route expressfs
oc delete pvc expressfs-pvc
```

### Delete Project

```bash
oc delete project expressfs
```

## Advanced Configuration

### Using ConfigMap

```bash
# Create ConfigMap
oc create configmap expressfs-config \
  --from-file=config/config.js

# Mount ConfigMap
oc set volume deployment/expressfs \
  --add --type=configmap \
  --configmap-name=expressfs-config \
  --mount-path=/app/config
```

### Using ImageStreams

```bash
# Create ImageStream
oc import-image expressfs:2.0.0 \
  --from=quay.io/istrate/expressfs:2.0.0 \
  --confirm

# Update deployment to use ImageStream
oc set triggers deployment/expressfs \
  --from-image=expressfs:2.0.0 \
  --containers=expressfs
```

## Support

For issues and questions:
- Check application logs: `oc logs -l app=expressfs`
- Review OpenShift events: `oc get events`
- Consult OpenShift documentation: https://docs.openshift.com/

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [ExpressFS GitHub Repository](https://github.com/yourusername/expressfs)