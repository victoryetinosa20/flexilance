"""
Custom file fields for handling both Cloudinary and local storage backends.
"""
import os
from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files import File
from django.utils.deconstruct import deconstructible


@deconstructible
class FlexibleFileField(models.FileField):
    """
    A flexible file field that works with both Cloudinary and local storage.
    Automatically handles the differences between storage backends.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def deconstruct(self):
        """
        Required for Django migrations.
        """
        result = super().deconstruct()
        # Ensure we return exactly 4 values
        if len(result) == 4:
            return result
        elif len(result) == 3:
            # If parent returns 3 values, add empty kwargs
            name, path, args = result
            return name, path, args, {}
        else:
            # Fallback: return minimal required structure
            return (
                self.__class__.__name__,
                'core.fields.FlexibleFileField',
                [],
                {}
            )
    
    def pre_save(self, model_instance, add):
        """
        Handle file upload based on the current storage backend.
        """
        file = getattr(model_instance, self.attname)
        
        if file and not file._committed:
            # File needs to be saved
            if settings.CLOUDINARY_ENABLED:
                # Use Cloudinary storage
                try:
                    from cloudinary.uploader import upload
                    from cloudinary.utils import cloudinary_url
                    
                    # Upload to Cloudinary
                    result = upload(file, folder="flexilance")
                    file.name = result['public_id']
                    file._committed = True
                    
                except Exception as e:
                    # Fallback to local storage if Cloudinary fails
                    print(f"Cloudinary upload failed, falling back to local storage: {e}")
                    return super().pre_save(model_instance, add)
            else:
                # Use local storage
                return super().pre_save(model_instance, add)
        
        return file
    
    def generate_filename(self, instance, filename):
        """
        Generate filename based on storage backend.
        """
        if settings.CLOUDINARY_ENABLED:
            # For Cloudinary, we don't need to generate local filenames
            return filename
        else:
            # For local storage, use the default filename generation
            return super().generate_filename(instance, filename)


class FlexibleImageField(FlexibleFileField):
    """
    A flexible image field that works with both Cloudinary and local storage.
    """
    
    def __init__(self, *args, **kwargs):
        # Ensure we're using ImageField validators
        from django.core.validators import validate_image_file_extension
        kwargs.setdefault('validators', [validate_image_file_extension])
        super().__init__(*args, **kwargs)


def get_storage_backend_info():
    """
    Utility function to get information about the current storage backend.
    """
    return {
        'cloudinary_enabled': getattr(settings, 'CLOUDINARY_ENABLED', False),
        'storage_backend': settings.DEFAULT_FILE_STORAGE,
        'media_root': getattr(settings, 'MEDIA_ROOT', None),
        'media_url': getattr(settings, 'MEDIA_URL', None),
    }