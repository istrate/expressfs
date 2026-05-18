# ExpressFS - Simple Static File Server

A modern, feature-rich static file server built with Express.js, featuring file upload, pagination, progress tracking, and an intuitive web interface.

## Features

- 📤 **Multiple File Upload** - Upload single or multiple files with drag-and-drop support
- 📊 **Real-time Progress Tracking** - Individual progress bars for each file upload
- 📄 **Pagination** - Browse files with configurable pagination (10, 50, or 100 files per page)
- 💾 **File Management** - View, download, and delete files through a clean web interface
- 📈 **Summary Dashboard** - Real-time statistics showing total files and storage used
- 🔒 **Input Validation** - Built-in security and validation middleware
- 📝 **Comprehensive Logging** - Structured logging for all operations
- 🎨 **Modern UI** - Responsive design with smooth animations

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Local Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expressfs
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

## Configuration

Configuration can be set via environment variables or by editing `config/config.js`.

### Environment Variables

- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment mode (development/production)
- `MAX_FILE_SIZE` - Maximum file size in human-readable format (default: 5GB)
  - Supports: KB, MB, GB, TB (case-insensitive)
  - Examples: "5GB", "100MB", "1.5TB", "500KB"
- `STORE_DIRECTORY` - Directory for uploaded files (default: store)

### Configuration Options

Edit `config/config.js` to customize:

- **Server settings** - Port, host
- **Upload limits** - Max file size, allowed extensions
- **Pagination** - Default items per page, allowed limits
- **Logging** - Enable/disable logging, timestamp format

## API Endpoints

### GET /api/files
Get paginated list of files with metadata.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (10, 50, or 100)

**Response:**
```json
{
  "files": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalFiles": 42,
    "totalSize": 1048576,
    "filesPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/upload
Upload single or multiple files.

**Request:** multipart/form-data with `target_file` field

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 3 file(s)",
  "results": [...]
}
```

### POST /api/delete
Delete multiple files.

**Request Body:**
```json
{
  "files": ["file1.txt", "file2.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Files deleted successfully",
  "results": [...]
}
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t expressfs:latest .
```

### Run Container

```bash
docker run -d -p 8080:8080 --name expressfs expressfs:latest
```

## OpenShift Deployment

### Quick Deploy

Update storage class in deployment.yaml if needed, then deploy ExpressFS to OpenShift with a single command:

```bash
oc apply -f openshift/expressfs-deployment.yaml
```

This creates:
- **Deployment** with health checks and resource limits
- **Service** for internal cluster communication
- **Route** for external access
- **PersistentVolumeClaim** (10Gi) for file storage

Alternatively, you can copy the content of `openshift/expressfs-deployment.yaml` into the OpenShift web console to create the resources manually.


## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License

## Author

Daniel Istrate

## Version History

- **2.0.0** - Major refactor with modular architecture, pagination, multi-file upload
- **1.0.0** - Initial release with basic file upload/download functionality

## Support

For issues and questions, please open an issue on the repository.
