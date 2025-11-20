# Cloudinary Configuration for Flexilance

## Overview
Cloudinary is configured as the default file storage backend for media files (profile pictures, job attachments, proposal attachments).

## Configuration Details

### Current Setup
- **Cloud Name**: `da5ffidmp`
- **Storage Backend**: `cloudinary_storage.storage.MediaCloudinaryStorage`
- **Fallback**: Local file system storage if Cloudinary fails

### Environment Variables
The following environment variables can be used to override the default configuration:

```bash
CLOUDINARY_CLOUD_NAME=da5ffidmp
CLOUDINARY_API_KEY=958895321617771
CLOUDINARY_API_SECRET=TiyAqGUFbM6fKU-Q04LBMbCRvA0
```

### File Types Supported
- Images (profile pictures)
- Documents (job attachments, proposal attachments)
- All other file types

## How It Works

### Automatic Fallback
The system automatically falls back to local storage if:
- Cloudinary credentials are invalid
- Cloudinary API is unreachable
- Any Cloudinary operation fails

### Storage Utilities
The `core.storage_utils` module provides helper functions:
- `upload_file()` - Upload files to appropriate storage
- `delete_file()` - Delete files from storage
- `get_file_url()` - Get file URLs
- `get_storage_info()` - Get current storage configuration

### Usage Example
```python
from core.storage_utils import upload_file

# Upload a file
result = upload_file(file_object, folder="profiles")
if result['success']:
    file_url = result['url']
    print(f"File uploaded to: {file_url}")
```

## Testing
To test Cloudinary configuration:
```bash
python test_cloudinary.py
python test_file_upload.py
```

## File Structure in Cloudinary
- `profiles/` - User profile pictures
- `jobs/` - Job attachments
- `proposals/` - Proposal attachments
- `test_uploads/` - Test files

## Troubleshooting
1. **Check Cloudinary Status**: Run `python test_cloudinary.py`
2. **Test File Upload**: Run `python test_file_upload.py`
3. **Verify Credentials**: Ensure Cloudinary credentials are valid
4. **Check Network**: Ensure internet connectivity for Cloudinary API calls

## Notes
- Cloudinary is configured with secure HTTPS connections
- Files are automatically optimized and transformed by Cloudinary
- The system provides detailed error logging for debugging