import React, { FC, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import Image from "next/image";
import { Gallery } from "@/app/(main)/[locale]/gallery/types";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Badge } from "./ui/badge";
import {
  Calendar,
  Camera,
  Eye,
  FilePenLine,
  MapPin,
  ScanEye,
  Trash2,
  X,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { ButtonGroup } from "./ui/button-group";
import { useAuthStore } from "@/lib/stores/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { del } from "@/lib/fetcher";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useRouter } from "@/i18n/navigations";

const GalleryCard: FC<{ gallery: Gallery }> = ({ gallery }) => {
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await del(`/gallery/detail/${slug}/`);
      return response;
    },
    onSuccess: () => {
      toast.success("Photo deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setDeleteDialogOpen(false);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete photo: ${error.message}`);
    },
  });

  const handleDeletePhoto = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(gallery.slug);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{gallery.title || "Untitled"}</CardTitle>
          <CardDescription>{gallery.description}</CardDescription>
          <CardAction>
            <ButtonGroup>
              <Button onClick={() => setOpen(true)} className="cursor-pointer">
                <ScanEye />
              </Button>
              <Button
                onClick={() => router.push(`/gallery/${gallery.slug}/edit`)}
                className="cursor-pointer"
              >
                <FilePenLine />
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                disabled={userPermissions?.is_guest}
                onClick={handleDeletePhoto}
              >
                <Trash2 />
              </Button>
            </ButtonGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg">
            <Image
              src={gallery.thumbnail_url}
              alt={gallery.title || "Gallery image"}
              fill
              className="rounded-md object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </AspectRatio>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>{gallery.exif_summary}</span>
          </div>
          {gallery.is_featured && <Badge variant="secondary">Featured</Badge>}
        </CardFooter>
      </Card>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-screen flex flex-col">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>

          <div className="border-b bg-background px-6 py-4 shrink-0">
            <DrawerHeader className="p-0">
              <div className="flex items-center justify-center gap-2">
                <DrawerTitle className="text-2xl">
                  {gallery.title || "Untitled"}
                </DrawerTitle>
                {gallery.is_featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
              {gallery.description && (
                <DrawerDescription className="text-base mt-2">
                  {gallery.description}
                </DrawerDescription>
              )}
            </DrawerHeader>
          </div>

          <div className="flex-1 bg-black/95 flex items-center justify-center overflow-hidden min-h-0">
            <div className="relative w-full h-full">
              <Image
                src={gallery.thumbnail_url}
                alt={gallery.title || "Gallery image"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          <div className="border-t bg-background shrink-0">
            <ScrollArea className="h-48">
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {(gallery.camera_make ||
                    gallery.camera_model ||
                    gallery.lens_model) && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Camera
                      </h3>
                      <div className="space-y-1 text-sm">
                        {gallery.camera_make && (
                          <div>
                            <span className="text-muted-foreground block">
                              Model
                            </span>
                            <span className="font-medium">
                              {gallery.camera_make} {gallery.camera_model}
                            </span>
                          </div>
                        )}
                        {gallery.lens_model && (
                          <div>
                            <span className="text-muted-foreground block">
                              Lens
                            </span>
                            <span className="font-medium">
                              {gallery.lens_model}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {gallery.shooting_params &&
                    Object.keys(gallery.shooting_params).length > 0 && (
                      <>
                        {gallery.shooting_params.focal_length && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">
                              Focal Length
                            </h3>
                            <p className="text-2xl font-bold">
                              {gallery.shooting_params.focal_length}
                            </p>
                          </div>
                        )}
                        {gallery.shooting_params.aperture && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Aperture</h3>
                            <p className="text-2xl font-bold">
                              {gallery.shooting_params.aperture}
                            </p>
                          </div>
                        )}
                        {gallery.shooting_params.shutter_speed && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">
                              Shutter Speed
                            </h3>
                            <p className="text-2xl font-bold">
                              {gallery.shooting_params.shutter_speed}
                            </p>
                          </div>
                        )}
                        {gallery.shooting_params.iso && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold">ISO</h3>
                            <p className="text-2xl font-bold">
                              {gallery.shooting_params.iso}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                  {gallery.photo_properties &&
                    Object.keys(gallery.photo_properties).length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Properties</h3>
                        <div className="space-y-1 text-sm">
                          {gallery.photo_properties.width &&
                            gallery.photo_properties.height && (
                              <div>
                                <span className="text-muted-foreground block">
                                  Resolution
                                </span>
                                <span className="font-medium">
                                  {gallery.photo_properties.width} ×{" "}
                                  {gallery.photo_properties.height}
                                </span>
                              </div>
                            )}
                          {gallery.photo_properties.file_size && (
                            <div>
                              <span className="text-muted-foreground block">
                                Size
                              </span>
                              <span className="font-medium">
                                {(
                                  gallery.photo_properties.file_size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {gallery.location_info?.location && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h3>
                      <div className="text-sm">
                        <span className="font-medium block">
                          {gallery.location_info.location}
                        </span>
                        {gallery.location_info.latitude &&
                          gallery.location_info.longitude && (
                            <span className="text-muted-foreground text-xs">
                              {gallery.location_info.latitude},{" "}
                              {gallery.location_info.longitude}
                            </span>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Additional Info</h3>
                    <div className="space-y-1 text-sm">
                      {gallery.taken_at && (
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Taken
                          </span>
                          <span className="font-medium block">
                            {new Date(gallery.taken_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Views
                        </span>
                        <span className="font-medium block">
                          {gallery.view_count}
                        </span>
                      </div>
                      {gallery.category && (
                        <div>
                          <span className="text-muted-foreground block">
                            Category
                          </span>
                          <span className="font-medium">
                            {gallery.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {gallery.tags && gallery.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {gallery.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This action cannot be undone. This will permanently delete the
              photo "${gallery.title || "Untitled"}" and remove it from the
              gallery.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GalleryCard;
