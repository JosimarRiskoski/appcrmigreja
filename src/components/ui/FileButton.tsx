import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type Props = {
  label: string;
  accept?: string;
  onSelected: (file: File | null) => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "cancel" | "link";
};

export default function FileButton({ label, accept, onSelected, disabled, variant = "outline" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onSelected(e.target.files?.[0] ?? null)} />
      <Button type="button" variant={variant} disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" /> {label}
      </Button>
    </>
  );
}
