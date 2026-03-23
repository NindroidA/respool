"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBox, updateBox } from "@/app/(dashboard)/boxes/actions";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface BoxFormProps {
  box?: { id: string; name: string };
  trigger?: React.ReactNode;
}

export function BoxForm({ box, trigger }: BoxFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!box;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateBox(box.id, formData);
        toast.success("Box updated");
      } else {
        await createBox(formData);
        toast.success("Box created");
      }
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-(--accent-jade-hover)">
        {trigger ?? (
          <>
            <Plus className="h-4 w-4" />
            Add Box
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Box" : "Create Box"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="box-name">Name</Label>
            <Input
              id="box-name"
              name="name"
              defaultValue={box?.name}
              placeholder="e.g. Shelf A, PLA Box"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Create Box"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
