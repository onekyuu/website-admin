from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime
from io import BytesIO
import os
import exifread


def get_decimal_from_dms(dms, ref):
    """Convert GPS DMS format to decimal degrees"""
    degrees = dms[0]
    minutes = dms[1] / 60.0
    seconds = dms[2] / 3600.0

    decimal = degrees + minutes + seconds

    if ref in ['S', 'W']:
        decimal = -decimal

    return decimal


def extract_exif_with_exifread(image_file):
    """Extract EXIF using exifread library (more comprehensive)"""
    try:
        image_file.seek(0)
        tags = exifread.process_file(image_file, details=False)

        exif_data = {
            'shooting_params': {},
            'photo_properties': {},
            'location_info': {}
        }

        print(f"[INFO] exifread found {len(tags)} tags")

        # Print all available tags for debugging
        for tag, value in tags.items():
            if not tag.startswith('JPEGThumbnail') and not tag.startswith('Thumbnail'):
                print(f"[DEBUG] exifread Tag: {tag} = {value}")

        # Taken time
        for date_tag in ['EXIF DateTimeOriginal', 'EXIF DateTime', 'Image DateTime']:
            if date_tag in tags:
                try:
                    exif_data['taken_at'] = datetime.strptime(
                        str(tags[date_tag]), '%Y:%m:%d %H:%M:%S'
                    )
                    print(
                        f"[INFO] Found taken_at from {date_tag}: {exif_data['taken_at']}")
                    break
                except:
                    pass

        # Camera
        if 'Image Make' in tags:
            exif_data['camera_make'] = str(tags['Image Make']).strip()
        if 'Image Model' in tags:
            exif_data['camera_model'] = str(tags['Image Model']).strip()
        if 'EXIF LensModel' in tags:
            exif_data['lens_model'] = str(tags['EXIF LensModel']).strip()

        # Focal length
        if 'EXIF FocalLength' in tags:
            try:
                focal_str = str(tags['EXIF FocalLength'])
                if '/' in focal_str:
                    num, den = focal_str.split('/')
                    focal = float(num) / float(den)
                else:
                    focal = float(focal_str)
                exif_data['shooting_params']['focal_length'] = f"{focal:.0f}mm"
                print(
                    f"[INFO] Found focal_length: {exif_data['shooting_params']['focal_length']}")
            except Exception as e:
                print(f"[WARNING] Failed to parse focal_length: {e}")

        # Aperture
        if 'EXIF FNumber' in tags:
            try:
                f_str = str(tags['EXIF FNumber'])
                if '/' in f_str:
                    num, den = f_str.split('/')
                    f_num = float(num) / float(den)
                else:
                    f_num = float(f_str)
                exif_data['shooting_params']['aperture'] = f"f/{f_num:.1f}"
                print(
                    f"[INFO] Found aperture: {exif_data['shooting_params']['aperture']}")
            except Exception as e:
                print(f"[WARNING] Failed to parse aperture: {e}")

        # Shutter speed
        if 'EXIF ExposureTime' in tags:
            try:
                exp_str = str(tags['EXIF ExposureTime'])
                if '/' in exp_str:
                    num, den = exp_str.split('/')
                    if int(num) == 1:
                        exif_data['shooting_params']['shutter_speed'] = f"1/{den}s"
                    else:
                        speed = float(num) / float(den)
                        exif_data['shooting_params']['shutter_speed'] = f"{speed:.2f}s"
                else:
                    exif_data['shooting_params']['shutter_speed'] = f"{exp_str}s"
                print(
                    f"[INFO] Found shutter_speed: {exif_data['shooting_params']['shutter_speed']}")
            except Exception as e:
                print(f"[WARNING] Failed to parse shutter_speed: {e}")

        # ISO
        for iso_tag in ['EXIF ISOSpeedRatings', 'EXIF ISO', 'EXIF PhotographicSensitivity']:
            if iso_tag in tags:
                try:
                    iso_value = str(tags[iso_tag])
                    exif_data['shooting_params']['iso'] = f"ISO {iso_value}"
                    print(
                        f"[INFO] Found ISO from {iso_tag}: {exif_data['shooting_params']['iso']}")
                    break
                except Exception as e:
                    print(f"[WARNING] Failed to parse ISO: {e}")

        # GPS
        if 'GPS GPSLatitude' in tags and 'GPS GPSLatitudeRef' in tags:
            try:
                lat = tags['GPS GPSLatitude'].values
                lat_ref = str(tags['GPS GPSLatitudeRef'])
                lat_decimal = get_decimal_from_dms(
                    [float(x.num)/float(x.den) for x in lat], lat_ref)
                exif_data['location_info']['latitude'] = str(lat_decimal)
            except Exception as e:
                print(f"[WARNING] Failed to parse GPS latitude: {e}")

        if 'GPS GPSLongitude' in tags and 'GPS GPSLongitudeRef' in tags:
            try:
                lon = tags['GPS GPSLongitude'].values
                lon_ref = str(tags['GPS GPSLongitudeRef'])
                lon_decimal = get_decimal_from_dms(
                    [float(x.num)/float(x.den) for x in lon], lon_ref)
                exif_data['location_info']['longitude'] = str(lon_decimal)
            except Exception as e:
                print(f"[WARNING] Failed to parse GPS longitude: {e}")

        return exif_data

    except Exception as e:
        print(f"[ERROR] exifread extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            'shooting_params': {},
            'photo_properties': {},
            'location_info': {}
        }


def extract_exif_data(image_file):
    """Extract EXIF information from image"""
    try:
        image = Image.open(image_file)
        exif_data = {
            'shooting_params': {},
            'photo_properties': {},
            'location_info': {}
        }

        # Get basic image info
        exif_data['photo_properties']['width'] = image.width
        exif_data['photo_properties']['height'] = image.height

        # Get file size
        image_file.seek(0, os.SEEK_END)
        exif_data['photo_properties']['file_size'] = image_file.tell()
        image_file.seek(0)

        # Try exifread first (more reliable for some cameras)
        print("[INFO] Attempting EXIF extraction with exifread...")
        exifread_data = extract_exif_with_exifread(image_file)

        # Merge exifread results
        if exifread_data.get('taken_at'):
            exif_data['taken_at'] = exifread_data['taken_at']
        if exifread_data.get('camera_make'):
            exif_data['camera_make'] = exifread_data['camera_make']
        if exifread_data.get('camera_model'):
            exif_data['camera_model'] = exifread_data['camera_model']
        if exifread_data.get('lens_model'):
            exif_data['lens_model'] = exifread_data['lens_model']

        exif_data['shooting_params'].update(
            exifread_data.get('shooting_params', {}))
        exif_data['location_info'].update(
            exifread_data.get('location_info', {}))

        # Fallback to PIL if exifread didn't get everything
        image_file.seek(0)
        image = Image.open(image_file)

        # Get EXIF info - try multiple methods
        exif = None

        # Method 1: Standard getexif()
        try:
            exif = image.getexif()
        except:
            pass

        # Method 2: _getexif() for older format
        if not exif or len(exif) == 0:
            try:
                exif = image._getexif()
            except:
                pass

        if exif and len(exif) > 0:
            print(f"[INFO] PIL found {len(exif)} EXIF tags")

            # Process EXIF tags (only if not already found by exifread)
            for tag_id, value in exif.items():
                try:
                    tag = TAGS.get(tag_id, tag_id)

                    # Only process if not already extracted
                    if tag in ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized'] and 'taken_at' not in exif_data:
                        try:
                            if isinstance(value, bytes):
                                value = value.decode('utf-8', errors='ignore')
                            exif_data['taken_at'] = datetime.strptime(
                                str(value), '%Y:%m:%d %H:%M:%S'
                            )
                        except:
                            pass

                    elif tag == 'Make' and 'camera_make' not in exif_data:
                        if isinstance(value, bytes):
                            value = value.decode('utf-8', errors='ignore')
                        exif_data['camera_make'] = str(value).strip()

                    elif tag == 'Model' and 'camera_model' not in exif_data:
                        if isinstance(value, bytes):
                            value = value.decode('utf-8', errors='ignore')
                        exif_data['camera_model'] = str(value).strip()

                    elif tag == 'LensModel' and 'lens_model' not in exif_data:
                        if isinstance(value, bytes):
                            value = value.decode('utf-8', errors='ignore')
                        exif_data['lens_model'] = str(value).strip()

                except:
                    continue

        # Summary
        print(f"[INFO] EXIF extraction complete:")
        print(
            f"  - Camera: {exif_data.get('camera_make', 'N/A')} {exif_data.get('camera_model', 'N/A')}")
        print(f"  - Lens: {exif_data.get('lens_model', 'N/A')}")
        print(f"  - Shooting params: {exif_data['shooting_params']}")
        print(f"  - Photo properties: {exif_data['photo_properties']}")
        print(f"  - Location: {exif_data['location_info']}")

        return exif_data

    except Exception as e:
        print(f"[ERROR] Error extracting EXIF data: {e}")
        import traceback
        traceback.print_exc()
        return {
            'shooting_params': {},
            'photo_properties': {},
            'location_info': {}
        }


def create_thumbnail(image_file, max_size=(800, 800)):
    """Create thumbnail"""
    try:
        image = Image.open(image_file)

        # Resize while maintaining aspect ratio
        image.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Convert to RGB (if RGBA)
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        # Save to memory
        thumb_io = BytesIO()
        image.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)

        return thumb_io

    except Exception as e:
        print(f"[ERROR] Error creating thumbnail: {e}")
        return None
