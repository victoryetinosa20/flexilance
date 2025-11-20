"""
Utility functions for handling file storage with Cloudinary and local storage backends.
"""
import os
from django.conf import settings
from django.core.files.storage import default_storage


def upload_file(file_obj, folder=None):
    """
    Upload a file to the appropriate storage backend.
    
    Args:
        file_obj: The file object to upload
        folder: Optional folder path for organization
        
    Returns:
        dict: Upload result with file information
    """
    if settings.CLOUDINARY_ENABLED:
        try:
            from cloudinary.uploader import upload
            
            # Upload to Cloudinary
            upload_options = {}
            if folder:
                upload_options['folder'] = folder
            
            result = upload(file_obj, **upload_options)
            
            return {
                'success': True,
                'storage_backend': 'cloudinary',
                'public_id': result['public_id'],
                'url': result['secure_url'],
                'resource_type': result['resource_type']
            }
            
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            # Fallback to local storage
            return upload_file_local(file_obj, folder)
    
    else:
        # Use local storage
        return upload_file_local(file_obj, folder)


def upload_file_local(file_obj, folder=None):
    """
    Upload a file to local storage.
    
    Args:
        file_obj: The file object to upload
        folder: Optional folder path for organization
        
    Returns:
        dict: Upload result with file information
    """
    try:
        # Generate filename
        if folder:
            filename = os.path.join(folder, file_obj.name)
        else:
            filename = file_obj.name
        
        # Save file using default storage
        saved_name = default_storage.save(filename, file_obj)
        
        return {
            'success': True,
            'storage_backend': 'local',
            'filename': saved_name,
            'url': default_storage.url(saved_name)
        }
        
    except Exception as e:
        print(f"Local file upload failed: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def delete_file(file_identifier, storage_backend='auto'):
    """
    Delete a file from storage.
    
    Args:
        file_identifier: Public ID (Cloudinary) or filename (local)
        storage_backend: 'cloudinary', 'local', or 'auto' to detect
        
    Returns:
        bool: True if deletion was successful
    """
    if storage_backend == 'auto':
        storage_backend = 'cloudinary' if settings.CLOUDINARY_ENABLED else 'local'
    
    if storage_backend == 'cloudinary':
        try:
            from cloudinary.uploader import destroy
            
            result = destroy(file_identifier)
            return result.get('result') == 'ok'
            
        except Exception as e:
            print(f"Cloudinary deletion failed: {e}")
            return False
    
    else:
        # Local storage
        try:
            default_storage.delete(file_identifier)
            return True
        except Exception as e:
            print(f"Local file deletion failed: {e}")
            return False


def get_file_url(file_identifier, storage_backend='auto'):
    """
    Get the URL for a file.
    
    Args:
        file_identifier: Public ID (Cloudinary) or filename (local)
        storage_backend: 'cloudinary', 'local', or 'auto' to detect
        
    Returns:
        str: File URL or None if not found
    """
    if storage_backend == 'auto':
        storage_backend = 'cloudinary' if settings.CLOUDINARY_ENABLED else 'local'
    
    if storage_backend == 'cloudinary':
        try:
            from cloudinary.utils import cloudinary_url
            
            url, _ = cloudinary_url(file_identifier)
            return url
            
        except Exception as e:
            print(f"Cloudinary URL generation failed: {e}")
            return None
    
    else:
        # Local storage
        try:
            return default_storage.url(file_identifier)
        except Exception as e:
            print(f"Local file URL generation failed: {e}")
            return None


def get_storage_info():
    """
    Get information about the current storage configuration.
    
    Returns:
        dict: Storage configuration information
    """
    return {
        'cloudinary_enabled': getattr(settings, 'CLOUDINARY_ENABLED', False),
        'storage_backend': settings.DEFAULT_FILE_STORAGE,
        'media_root': getattr(settings, 'MEDIA_ROOT', None),
        'media_url': getattr(settings, 'MEDIA_URL', None),
    }