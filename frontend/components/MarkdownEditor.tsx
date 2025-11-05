"use client";

import React, { useState, useEffect } from "react";
import { marked } from "marked";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  className,
  minHeight = "300px",
}) => {
  const [html, setHtml] = useState("");

  useEffect(() => {
    // 配置 marked
    marked.setOptions({
      breaks: true, // 支持 GitHub 风格的换行
      gfm: true, // 启用 GitHub Flavored Markdown
    });

    // 将 Markdown 转换为 HTML
    const convertedHtml = marked(value || "");
    setHtml(convertedHtml as string);
  }, [value]);

  return (
    <Tabs defaultValue="edit" className={cn("w-full", className)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="mt-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono"
          style={{ minHeight }}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-2">
        <div
          className={cn(
            "prose prose-sm max-w-none dark:prose-invert",
            "border rounded-md p-4 bg-muted/50 overflow-auto",
          )}
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default MarkdownEditor;
