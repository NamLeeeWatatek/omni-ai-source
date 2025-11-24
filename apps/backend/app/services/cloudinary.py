import cloudinary
import cloudinary.uploader
from app.core.config import settings

class CloudinaryService:
    def __init__(self):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

    def upload_image(self, file_path: str, public_id: str = None):
        try:
            response = cloudinary.uploader.upload(
                file_path,
                public_id=public_id,
                upload_preset=settings.CLOUDINARY_UPLOAD_PRESET
            )
            return response
        except Exception as e:
            print(f"Error uploading to Cloudinary: {e}")
            return None

    def upload_video(self, file_path: str, public_id: str = None):
        try:
            response = cloudinary.uploader.upload(
                file_path,
                resource_type="video",
                public_id=public_id,
                upload_preset=settings.CLOUDINARY_UPLOAD_PRESET
            )
            return response
        except Exception as e:
            print(f"Error uploading video to Cloudinary: {e}")
            return None

cloudinary_service = CloudinaryService()
