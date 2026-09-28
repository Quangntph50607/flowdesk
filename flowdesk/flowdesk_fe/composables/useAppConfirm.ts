type AppConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type PrimeLikeConfirmOptions = {
  message: string;
  header?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptProps?: {
    severity?: string;
  };
  accept?: () => void | Promise<void>;
  reject?: () => void | Promise<void>;
};

type AppConfirmState = AppConfirmOptions & {
  open: boolean;
  resolver?: (value: boolean) => void;
};

function confirmState() {
  return useState<AppConfirmState>("app-confirm", () => ({
    open: false,
    message: "",
    tone: "default",
  }));
}

export function useAppConfirm() {
  const state = confirmState();

  function ask(options: AppConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      state.value = {
        open: true,
        title: options.title ?? "Xác nhận thao tác",
        message: options.message,
        confirmLabel: options.confirmLabel ?? "Xác nhận",
        cancelLabel: options.cancelLabel ?? "Hủy",
        tone: options.tone ?? "default",
        resolver: resolve,
      };
    });
  }

  async function require(options: PrimeLikeConfirmOptions) {
    const accepted = await ask({
      title: options.header,
      message: options.message,
      confirmLabel: options.acceptLabel,
      cancelLabel: options.rejectLabel,
      tone: options.acceptProps?.severity === "danger" ? "danger" : "default",
    });

    if (accepted) {
      await options.accept?.();
      return;
    }

    await options.reject?.();
  }

  function close(value: boolean) {
    state.value.resolver?.(value);
    state.value = {
      open: false,
      message: "",
      tone: "default",
    };
  }

  return {
    state,
    ask,
    require,
    confirm: () => close(true),
    cancel: () => close(false),
  };
}
