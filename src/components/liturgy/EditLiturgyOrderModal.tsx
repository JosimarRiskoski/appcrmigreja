import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditLiturgyOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liturgyId: string | null;
  onChanged: () => void;
}

interface OrderItem {
  id: string;
  title: string;
  notes: string | null;
  duration_minutes: number | null;
  position: number;
}

export function EditLiturgyOrderModal({ open, onOpenChange, liturgyId, onChanged }: EditLiturgyOrderModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('liturgy_order_items')
        .select('id, title, notes, duration_minutes, position')
        .eq('liturgy_id', liturgyId!)
        .order('position');
      setItems((data || []) as OrderItem[]);
    } catch {
      toast.error('Erro ao carregar ordem');
    }
  }, [liturgyId]);

  useEffect(() => {
    if (open && liturgyId) loadItems();
  }, [open, liturgyId, loadItems]);


  const addItem = async () => {
    if (!liturgyId || !title.trim()) return;
    setLoading(true);
    try {
      const position = items.length + 1;
      const { error } = await supabase
        .from('liturgy_order_items')
        .insert({
          liturgy_id: liturgyId,
          title: title.trim(),
          notes: notes.trim() || null,
          duration_minutes: duration ? Number(duration) : null,
          position,
        });
      if (error) throw error;
      setTitle("");
      setNotes("");
      setDuration("");
      await loadItems();
      onChanged();
    } catch {
      toast.error('Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, patch: Partial<OrderItem>) => {
    try {
      const { error } = await supabase
        .from('liturgy_order_items')
        .update({
          title: patch.title,
          notes: patch.notes,
          duration_minutes: patch.duration_minutes,
        })
        .eq('id', id);
      if (error) throw error;
      await loadItems();
      onChanged();
    } catch {
      toast.error('Erro ao atualizar item');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('liturgy_order_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      const reordered = items
        .filter(i => i.id !== id)
        .sort((a, b) => a.position - b.position)
        .map((i, idx) => ({ ...i, position: idx + 1 }));
      setItems(reordered);
      for (const i of reordered) {
        await supabase
          .from('liturgy_order_items')
          .update({ position: i.position })
          .eq('id', i.id);
      }
      await loadItems();
      onChanged();
    } catch {
      toast.error('Erro ao remover item');
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const copy = [...items];
    const a = copy[idx];
    const b = copy[newIdx];
    copy[idx] = { ...b, position: a.position };
    copy[newIdx] = { ...a, position: b.position };
    setItems(copy);
    await supabase
      .from('liturgy_order_items')
      .update({ position: copy[idx].position })
      .eq('id', copy[idx].id);
    await supabase
      .from('liturgy_order_items')
      .update({ position: copy[newIdx].position })
      .eq('id', copy[newIdx].id);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ordem de Culto</DialogTitle>
          <DialogDescription>Gerencie os itens da ordem</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="Duração (min)" value={duration} onChange={e => setDuration(e.target.value)} />
            <Textarea placeholder="Notas" value={notes} onChange={e => setNotes(e.target.value)} />
            <Button onClick={addItem} disabled={loading}>Adicionar</Button>
          </div>

          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum item</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="border border-border rounded p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input value={item.title} onChange={e => updateItem(item.id, { title: e.target.value })} />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => move(item.id, -1)}>↑</Button>
                      <Button variant="outline" onClick={() => move(item.id, 1)}>↓</Button>
                      <Button variant="destructive" onClick={() => removeItem(item.id)}>Remover</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Textarea value={item.notes || ""} onChange={e => updateItem(item.id, { notes: e.target.value })} />
                    <Input value={item.duration_minutes?.toString() || ""} onChange={e => updateItem(item.id, { duration_minutes: e.target.value ? Number(e.target.value) : null })} />
                    <div className="text-sm text-muted-foreground">Posição: {item.position}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}