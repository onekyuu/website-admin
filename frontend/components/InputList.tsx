"use client";

import React, { FC } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";

interface InputListProps {
  field: {
    value?: string[];
    onChange: (value: string[]) => void;
  };
  placeholder: string;
  addText: string;
  onChange?: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  onAdd?: () => void;
  maxItems?: number;
}

const InputList: FC<InputListProps> = ({
  field,
  placeholder,
  addText,
  onChange,
  onAdd,
  onRemove,
  maxItems,
}) => {
  return (
    <div className="space-y-2">
      {field.value?.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => onChange?.(index, e.target.value)}
            placeholder={placeholder + ` ${index + 1}`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onRemove?.(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {maxItems === undefined || (field.value?.length || 0) < maxItems ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => onAdd?.()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addText}
        </Button>
      ) : null}
    </div>
  );
};

export default InputList;
