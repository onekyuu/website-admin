export interface Gallery {
  id: number;
  created_at: string;
  updated_at: string;
  image_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  camera_make: string;
  camera_model: string;
  lens_model: string;
  shooting_params: {
    focal_length: string;
    aperture: string;
    shutter_speed: string;
    iso: string;
  };
  photo_properties: {
    width: number;
    height: number;
    file_size: number;
  };
  location_info: {
    latitude: string;
    longitude: string;
    location: string;
  };
  exif_summary: string;
  taken_at: string;
  view_count: number;
}

export interface GalleryListResponse {
  results: Gallery[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
