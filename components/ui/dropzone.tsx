"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = {
  file: File | null;
  onFileSelected: (file: File) => void;
  label?: string;
};

const Dropzone = ({ file, onFileSelected, label = "Upload a product photo" }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFileSelected(dropped);
      }}
      className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-4 text-center transition-colors ${
        isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"
      }`}
    >
      {previewUrl ? (
        <div className="relative h-24 w-24 overflow-hidden rounded-sm border border-border">
          <Image src={previewUrl} alt="Selected upload" fill unoptimized className="object-cover" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{label}</p>
      )}
      <p className="text-[10px] uppercase tracking-widest text-accent">
        {file ? "Replace" : "Click or drop an image"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onFileSelected(selected);
        }}
      />
    </div>
  );
};

export default Dropzone;
