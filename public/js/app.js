/**
 * ExpressFS Frontend Application
 */

// Application state
const state = {
    filesVisible: false,
    currentPage: 1,
    itemsPerPage: 10,
    paginationData: null,
    uploadInProgress: false
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('ExpressFS initialized');
});

// Modal functions
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    if (state.uploadInProgress) {
        if (!confirm('Upload is in progress. Are you sure you want to close?')) {
            return;
        }
    }
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('uploadForm').reset();
    document.getElementById('progressContainer').classList.remove('active');
    document.getElementById('progressList').innerHTML = '';
    document.getElementById('selectedFilesInfo').style.display = 'none';
    document.getElementById('uploadSummary').style.display = 'none';
    state.uploadInProgress = false;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal && !state.uploadInProgress) {
        closeUploadModal();
    }
}

// Go to List Files from upload modal
function goToListFiles() {
    closeUploadModal();
    if (!state.filesVisible) {
        toggleFileList();
    }
}

// Update file count display
function updateFileCount() {
    const fileInput = document.getElementById('fileInput');
    const info = document.getElementById('selectedFilesInfo');
    
    if (fileInput.files.length > 0) {
        const totalSize = Array.from(fileInput.files).reduce((sum, file) => sum + file.size, 0);
        info.textContent = `${fileInput.files.length} file(s) selected (${formatFileSize(totalSize)})`;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

// Show message to user
function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    container.innerHTML = '';
    container.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Upload files
async function uploadFiles(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) {
        showMessage('Please select at least one file', 'error');
        return;
    }

    const progressContainer = document.getElementById('progressContainer');
    const progressList = document.getElementById('progressList');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadSummary = document.getElementById('uploadSummary');

    progressContainer.classList.add('active');
    progressList.innerHTML = '';
    uploadBtn.disabled = true;
    state.uploadInProgress = true;
    uploadSummary.style.display = 'none';

    // Create progress bars for each file
    const progressBars = {};
    files.forEach((file, index) => {
        const progressItem = document.createElement('div');
        progressItem.className = 'file-progress-item';
        progressItem.innerHTML = `
            <div class="file-progress-name">📄 ${file.name} (${formatFileSize(file.size)})</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-${index}">0%</div>
            </div>
        `;
        progressList.appendChild(progressItem);
        progressBars[index] = document.getElementById(`progress-${index}`);
    });

    const results = [];

    // Upload files sequentially to show individual progress
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('target_file', file);

        try {
            await uploadSingleFile(formData, progressBars[i]);
            results.push({ filename: file.name, success: true });
        } catch (error) {
            results.push({ filename: file.name, success: false, error: error.message });
        }
    }

    state.uploadInProgress = false;
    uploadBtn.disabled = false;

    // Show summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    let summaryClass = 'success';
    let summaryText = `✅ Successfully uploaded ${successCount} file(s)`;
    
    if (failCount > 0) {
        summaryClass = 'partial';
        summaryText = `⚠️ Uploaded ${successCount} file(s), ${failCount} failed`;
    }
    
    uploadSummary.className = `upload-summary ${summaryClass}`;
    uploadSummary.textContent = summaryText;
    uploadSummary.style.display = 'block';

    showMessage(summaryText, failCount > 0 ? 'error' : 'success');

    if (state.filesVisible) {
        setTimeout(() => loadFiles(), 1000);
    }
}

// Upload single file with progress tracking
function uploadSingleFile(formData, progressBar) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressBar.textContent = percentComplete + '%';
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                progressBar.style.width = '100%';
                progressBar.textContent = '✓ Complete';
                progressBar.classList.add('complete');
                resolve();
            } else {
                progressBar.style.width = '100%';
                progressBar.textContent = '✗ Failed';
                progressBar.classList.add('error');
                reject(new Error('Upload failed'));
            }
        });

        xhr.addEventListener('error', () => {
            progressBar.style.width = '100%';
            progressBar.textContent = '✗ Error';
            progressBar.classList.add('error');
            reject(new Error('Network error'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
    });
}

// Toggle file list visibility
async function toggleFileList() {
    state.filesVisible = !state.filesVisible;
    const section = document.getElementById('fileListSection');
    
    if (state.filesVisible) {
        section.classList.add('visible');
        state.currentPage = 1;
        await loadFiles();
    } else {
        section.classList.remove('visible');
    }
}

// Load files from server
async function loadFiles() {
    const container = document.getElementById('fileListContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading files...</div>';

    try {
        const response = await fetch(`/api/files?page=${state.currentPage}&limit=${state.itemsPerPage}`);
        const data = await response.json();
        
        state.paginationData = data.pagination;
        const files = data.files;

        // Update summary section
        updateSummary(state.paginationData);

        if (state.paginationData.totalFiles === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <h3>No files uploaded yet</h3>
                    <p>Click "Upload Files" to get started</p>
                </div>
            `;
            document.getElementById('summarySection').style.display = 'none';
            document.getElementById('paginationControls').style.display = 'none';
            return;
        }

        // Show pagination controls
        document.getElementById('paginationControls').style.display = 'flex';

        let html = '<div class="file-list">';
        files.forEach(file => {
            const date = new Date(file.uploadDate);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const fileSize = formatFileSize(file.size);
            const encodedFilename = encodeURIComponent(file.name);
            
            html += `
                <div class="file-item">
                    <input type="checkbox" class="file-checkbox" value="${file.name}" onchange="updateActionButtons()">
                    <div class="file-info">
                        <div class="file-name">📄 ${file.name}</div>
                        <div class="file-meta">
                            📅 ${formattedDate} | 💾 ${fileSize}
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn-icon btn-download-single" onclick="downloadSingleFile('${encodedFilename}')" title="Download">
                            📥
                        </button>
                        <button class="btn-icon btn-delete-single" onclick="deleteSingleFile('${encodedFilename}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        // Update pagination buttons
        updatePaginationButtons();

    } catch (error) {
        container.innerHTML = `
            <div class="message error">
                ❌ Failed to load files: ${error.message}
            </div>
        `;
    }
}

// Update summary section
function updateSummary(pagination) {
    const summarySection = document.getElementById('summarySection');
    summarySection.style.display = 'grid';

    document.getElementById('totalFilesCount').textContent = pagination.totalFiles;
    document.getElementById('totalFilesSize').textContent = formatFileSize(pagination.totalSize);
    document.getElementById('currentPageFiles').textContent = 
        `${Math.min((pagination.currentPage - 1) * pagination.filesPerPage + 1, pagination.totalFiles)}-${Math.min(pagination.currentPage * pagination.filesPerPage, pagination.totalFiles)}`;
}

// Update pagination buttons
function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = !state.paginationData.hasPrevPage;
    nextBtn.disabled = !state.paginationData.hasNextPage;
    pageInfo.textContent = `Page ${state.paginationData.currentPage} of ${state.paginationData.totalPages}`;
}

// Navigate to previous page
function previousPage() {
    if (state.currentPage > 1) {
        state.currentPage--;
        loadFiles();
    }
}

// Navigate to next page
function nextPage() {
    if (state.paginationData && state.currentPage < state.paginationData.totalPages) {
        state.currentPage++;
        loadFiles();
    }
}

// Change items per page
function changeItemsPerPage() {
    state.itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    state.currentPage = 1;
    loadFiles();
}

// Format file size to human readable
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Update action buttons state (delete and download)
function updateActionButtons() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    const deleteBtn = document.getElementById('deleteBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const hasSelection = checkboxes.length > 0;
    
    deleteBtn.disabled = !hasSelection;
    downloadBtn.disabled = !hasSelection;
}

// Backward compatibility
function updateDeleteButton() {
    updateActionButtons();
}

// Delete selected files
async function deleteSelectedFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    const filesToDelete = Array.from(checkboxes).map(cb => cb.value);

    if (filesToDelete.length === 0) {
        return;
    }

    if (!confirm(`Are you sure you want to delete ${filesToDelete.length} file(s)?`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: filesToDelete })
        });

        const result = await response.json();

        if (response.ok || response.status === 207) {
            const successCount = result.results.filter(r => r.success).length;
            showMessage(`✅ Successfully deleted ${successCount} file(s)`, 'success');
            await loadFiles();
        } else {
            showMessage(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Delete failed: ${error.message}`, 'error');
    }
}

// Download a single file
function downloadSingleFile(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename);
    window.location.href = `/api/download/${encodedFilename}`;
    showMessage(`📥 Downloading ${filename}...`, 'success');
}

// Delete a single file
async function deleteSingleFile(encodedFilename) {
    const filename = decodeURIComponent(encodedFilename);
    
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: [filename] })
        });

        const result = await response.json();

        if (response.ok || response.status === 207) {
            showMessage(`✅ File "${filename}" deleted successfully`, 'success');
            await loadFiles();
        } else {
            showMessage(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Delete failed: ${error.message}`, 'error');
    }
}

// Download selected files as ZIP
async function downloadSelectedFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    const filesToDownload = Array.from(checkboxes).map(cb => cb.value);

    if (filesToDownload.length === 0) {
        return;
    }

    try {
        showMessage(`📥 Preparing download of ${filesToDownload.length} file(s)...`, 'success');

        const response = await fetch('/api/download-bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: filesToDownload })
        });

        if (!response.ok) {
            const error = await response.json();
            showMessage(`❌ ${error.error}`, 'error');
            return;
        }

        // Get the blob from response
        const blob = await response.blob();
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'expressfs-files.zip';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showMessage(`✅ Downloaded ${filesToDownload.length} file(s) as ${filename}`, 'success');
    } catch (error) {
        showMessage(`❌ Download failed: ${error.message}`, 'error');
    }
}