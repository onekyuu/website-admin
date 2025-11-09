from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime
from io import BytesIO
import os
import exifread
from django.utils import timezone


def make_aware_datetime(dt):
    """Convert naive datetime to aware datetime"""
    try:
        if dt is None:
            return None

        if timezone.is_aware(dt):
            return dt

        return timezone.make_aware(dt, timezone.get_current_timezone())
    except Exception:
        return None


def get_decimal_from_dms(dms, ref):
    """Convert GPS DMS format to decimal degrees"""
    try:
        degrees = dms[0]
        minutes = dms[1] / 60.0
        seconds = dms[2] / 3600.0

        decimal = degrees + minutes + seconds

        if ref in ['S', 'W']:
            decimal = -decimal

        return decimal
    except Exception:
        return None


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

        # Taken time
        for date_tag in ['EXIF DateTimeOriginal', 'EXIF DateTime', 'Image DateTime']:
            if date_tag in tags:
                try:
                    naive_dt = datetime.strptime(
                        str(tags[date_tag]), '%Y:%m:%d %H:%M:%S'
                    )
                    exif_data['taken_at'] = make_aware_datetime(naive_dt)
                    break
                except Exception:
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
            except Exception:
                pass

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
            except Exception:
                pass

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
            except Exception:
                pass

        # ISO
        for iso_tag in ['EXIF ISOSpeedRatings', 'EXIF ISO', 'EXIF PhotographicSensitivity']:
            if iso_tag in tags:
                try:
                    iso_value = str(tags[iso_tag])
                    exif_data['shooting_params']['iso'] = f"ISO {iso_value}"
                    break
                except Exception:
                    pass

        # GPS - Enhanced extraction
        try:
            if 'GPS GPSLatitude' in tags and 'GPS GPSLatitudeRef' in tags:
                lat = tags['GPS GPSLatitude'].values
                lat_ref = str(tags['GPS GPSLatitudeRef'])
                lat_decimal = get_decimal_from_dms(
                    [float(x.num)/float(x.den) for x in lat], lat_ref)

                if lat_decimal is not None:
                    exif_data['location_info']['latitude'] = f"{lat_decimal:.6f}"

            if 'GPS GPSLongitude' in tags and 'GPS GPSLongitudeRef' in tags:
                lon = tags['GPS GPSLongitude'].values
                lon_ref = str(tags['GPS GPSLongitudeRef'])
                lon_decimal = get_decimal_from_dms(
                    [float(x.num)/float(x.den) for x in lon], lon_ref)

                if lon_decimal is not None:
                    exif_data['location_info']['longitude'] = f"{lon_decimal:.6f}"

            if 'GPS GPSAltitude' in tags:
                try:
                    alt_str = str(tags['GPS GPSAltitude'])
                    if '/' in alt_str:
                        num, den = alt_str.split('/')
                        altitude = float(num) / float(den)
                    else:
                        altitude = float(alt_str)
                    exif_data['location_info']['altitude'] = f"{altitude:.1f}m"
                except Exception:
                    pass

        except Exception:
            pass

        return exif_data

    except Exception:
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

        # Fallback to PIL for GPS if not found
        if not exif_data['location_info'] or not exif_data['location_info'].get('latitude'):
            image_file.seek(0)
            image = Image.open(image_file)

            try:
                exif = image.getexif()
                if exif:
                    gps_ifd = exif.get_ifd(0x8825)

                    if gps_ifd:
                        # Latitude
                        if 2 in gps_ifd and 1 in gps_ifd:
                            lat = gps_ifd[2]
                            lat_ref = gps_ifd[1]
                            lat_decimal = get_decimal_from_dms(lat, lat_ref)
                            if lat_decimal is not None:
                                exif_data['location_info']['latitude'] = f"{lat_decimal:.6f}"

                        # Longitude
                        if 4 in gps_ifd and 3 in gps_ifd:
                            lon = gps_ifd[4]
                            lon_ref = gps_ifd[3]
                            lon_decimal = get_decimal_from_dms(lon, lon_ref)
                            if lon_decimal is not None:
                                exif_data['location_info']['longitude'] = f"{lon_decimal:.6f}"

                        # Altitude
                        if 6 in gps_ifd:
                            alt = gps_ifd[6]
                            if isinstance(alt, tuple):
                                altitude = alt[0] / \
                                    alt[1] if alt[1] != 0 else alt[0]
                            else:
                                altitude = float(alt)
                            exif_data['location_info']['altitude'] = f"{altitude:.1f}m"
            except Exception:
                pass

        return exif_data

    except Exception:
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

    except Exception:
        return None
