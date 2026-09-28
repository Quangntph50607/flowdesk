export type AppToastSeverity = "success" | "info" | "warn" | "error";

export type AppToastInput = {
  severity?: AppToastSeverity;
  summary?: string;
  detail?: string;
  life?: number;
};

export type AppToastItem = Required<Pick<AppToastInput, "severity">> &
  Pick<AppToastInput, "summary" | "detail"> & {
    id: number;
    life: number;
  };

const DEFAULT_LIFE = 3200;

function toastState() {
  return useState<AppToastItem[]>("app-toasts", () => []);
}

export function useAppToast() {
  const toasts = toastState();

  function remove(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function add(input: AppToastInput) {
    const toast: AppToastItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      severity: input.severity ?? "info",
      summary: input.summary,
      detail: input.detail,
      life: input.life ?? DEFAULT_LIFE,
    };

    toasts.value = [...toasts.value, toast];

    if (import.meta.client && toast.life > 0) {
      window.setTimeout(() => remove(toast.id), toast.life);
    }
  }

  return {
    toasts,
    add,
    remove,
    success: (summary: string, detail?: string) =>
      add({ severity: "success", summary, detail }),
    error: (summary: string, detail?: string) =>
      add({ severity: "error", summary, detail }),
    info: (summary: string, detail?: string) =>
      add({ severity: "info", summary, detail }),
    warn: (summary: string, detail?: string) =>
      add({ severity: "warn", summary, detail }),
  };
}
