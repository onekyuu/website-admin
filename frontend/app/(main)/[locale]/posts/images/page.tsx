"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Loader2, Trash2, Search, Image as ImageIcon } from "lucide-react";
import { useDeleteOSSImage, useDeleteOSSImages } from "@/hooks/useOSSDelete";
import { get } from "@/lib/fetcher";
import { PaginationState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useAuthStore } from "@/lib/stores/auth";
import ImagesPage from "@/components/ImagesPage";

interface OSSImage {
  name: string;
  url: string;
  size: number;
  lastModified: string;
  directoryName: string;
  directory: string;
}

interface ListOSSImagesResponse {
  results: OSSImage[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const PostImagesPage = () => {
  return <ImagesPage directory="blog" i18n="Post.Images" />;
};

export default PostImagesPage;
