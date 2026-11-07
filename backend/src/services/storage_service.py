"""Package photo and proof of delivery storage service."""
import os
import uuid
from typing import Optional

from ..interfaces import StorageServiceInterface
from ..utils.audit_logger import log_security_event
from ..utils.logger import get_logger

logger = get_logger("service.storage")

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".uploads")
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 Megabytes

ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
}

# Magic bytes signature validation
MAGIC_SIGNATURES = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"RIFF", "image/webp"),  # Starts with RIFF and has WEBP at byte 8
]


class LocalStorageService(StorageServiceInterface):
    """Local development storage saving proof-of-delivery photos to disk."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or UPLOADS_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    @staticmethod
    def validate_photo_file(content: bytes, filename: str, content_type: Optional[str] = None) -> str:
        """
        Validates file size, file extension, and image magic bytes.
        
        Returns normalized mime type or raises ValueError.
        """
        if not content:
            raise ValueError("Uploaded file cannot be empty.")

        if len(content) > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum allowed limit of 5 MB ({len(content)} bytes).")

        clean_filename = os.path.basename(filename)
        ext = os.path.splitext(clean_filename)[1].lower()
        if not ext:
            raise ValueError("File must have a valid extension (.jpg, .jpeg, .png, .webp).")

        # Validate extension matches allowed list
        matched_mime = None
        for mime, allowed_exts in ALLOWED_MIME_TYPES.items():
            if ext in allowed_exts:
                matched_mime = mime
                break

        if not matched_mime:
            raise ValueError(
                f"Unsupported file extension '{ext}'. Only JPEG, PNG, and WebP images are allowed."
            )

        # Deep magic-byte inspection (prevent renaming .exe or .sh to .jpg)
        is_magic_valid = False
        if content.startswith(b"\xff\xd8\xff") and matched_mime == "image/jpeg":
            is_magic_valid = True
        elif content.startswith(b"\x89PNG\r\n\x1a\n") and matched_mime == "image/png":
            is_magic_valid = True
        elif content.startswith(b"RIFF") and b"WEBP" in content[:16] and matched_mime == "image/webp":
            is_magic_valid = True

        if not is_magic_valid:
            log_security_event(
                event_type="SUSPICIOUS_UPLOAD",
                action="validate_photo_file",
                status="BLOCKED",
                details={"filename": clean_filename, "reason": "Magic bytes mismatch"},
            )
            raise ValueError("File content does not match the expected image binary signature.")

        return matched_mime

    def save_photo(self, order_id: str, filename: str, content: bytes, content_type: str) -> str:
        """Validates and writes photo to local development storage with path traversal safeguards."""
        validated_mime = self.validate_photo_file(content, filename, content_type)
        
        # Strictly validate order_id against path traversal and illegal characters
        import re
        if not re.match(r"^[A-Za-z0-9\-_]{3,64}$", order_id):
            raise ValueError(f"Invalid consignment identifier '{order_id}': path traversal or illegal characters detected.")

        clean_filename = os.path.basename(filename)
        ext = os.path.splitext(clean_filename)[1].lower()
        unique_name = f"{order_id}_{uuid.uuid4().hex[:12]}{ext}"
        
        destination = os.path.abspath(os.path.join(self.base_dir, unique_name))
        resolved_base = os.path.abspath(self.base_dir)

        # Enforce that destination stays strictly inside base directory
        if not (destination.startswith(resolved_base + os.sep) or destination == resolved_base):
            raise ValueError("Invalid storage destination path: path traversal detected.")

        with open(destination, "wb") as f:
            f.write(content)

        logger.info(
            f"Saved package proof photo to local storage: {unique_name} ({len(content)} bytes)",
            extra={"extra": {"orderId": order_id, "file": unique_name}},
        )
        return f"/uploads/{unique_name}"


class S3StorageService(StorageServiceInterface):
    """Production Amazon S3 Storage Service with presigned upload and retrieval."""

    def __init__(self, bucket_name: Optional[str] = None, region: Optional[str] = None):
        self.bucket_name = bucket_name or os.getenv("UPLOADS_BUCKET_NAME", "aerodispatch-proofs-761112473042")
        self.region = region or os.getenv("AWS_DEFAULT_REGION", os.getenv("AWS_REGION", "ap-northeast-2"))
        try:
            import boto3
            self.s3_client = boto3.client("s3", region_name=self.region)
        except Exception as e:
            logger.warning(f"Failed to initialize boto3 S3 client: {e}")
            self.s3_client = None

    def save_photo(self, order_id: str, filename: str, content: bytes, content_type: str) -> str:
        """Validates magic bytes and uploads proof of delivery directly to S3."""
        validated_mime = LocalStorageService.validate_photo_file(content, filename, content_type)
        clean_filename = os.path.basename(filename)
        ext = os.path.splitext(clean_filename)[1].lower()
        unique_key = f"proofs/{order_id}/{uuid.uuid4().hex[:12]}{ext}"

        if not self.s3_client:
            raise RuntimeError("AWS S3 client is not available.")

        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=unique_key,
            Body=content,
            ContentType=validated_mime,
            ServerSideEncryption="AES256",
            Metadata={"orderId": order_id, "originalFilename": clean_filename},
        )
        logger.info(
            f"Uploaded proof photo to S3: s3://{self.bucket_name}/{unique_key}",
            extra={"extra": {"orderId": order_id, "s3Key": unique_key}},
        )
        # Generate presigned download URL valid for 7 days
        return self.generate_presigned_download_url(unique_key, expires_in=604800)

    def generate_presigned_upload_url(self, order_id: str, filename: str, expires_in: int = 900) -> dict:
        """Generates a presigned PUT URL allowing clients to upload directly to S3."""
        clean_filename = os.path.basename(filename)
        ext = os.path.splitext(clean_filename)[1].lower()
        unique_key = f"proofs/{order_id}/{uuid.uuid4().hex[:12]}{ext}"

        if not self.s3_client:
            raise RuntimeError("AWS S3 client is not available.")

        url = self.s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": self.bucket_name, "Key": unique_key},
            ExpiresIn=expires_in,
        )
        return {"uploadUrl": url, "key": unique_key}

    def generate_presigned_download_url(self, key: str, expires_in: int = 86400) -> str:
        """Generates a presigned GET URL for viewing private proof photos."""
        if not self.s3_client:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"

        return self.s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )
