"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const response = await fetch(`/api/meals/${mealId}`, { method: "DELETE" });
    setDeleting(false);

    if (response.ok) {
      router.push("/meals");
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <Button variant="danger" className="w-full" onClick={() => setConfirming(true)}>
        削除する
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">本当に削除しますか？</p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
          キャンセル
        </Button>
        <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting}>
          {deleting ? "削除中..." : "削除する"}
        </Button>
      </div>
    </div>
  );
}
