import { useEffect } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const OVERLAYS = ".modal-overlay, .staff-confirm-overlay";

const topDialog = () => {
  const all = document.querySelectorAll(OVERLAYS);
  return all.length ? all[all.length - 1] : null;
};

// One place gives every dialog the same keyboard behaviour: Esc closes it, Tab never leaves it,
// and focus goes back to what was selected before it opened.
export default function DialogAccessibility() {
  useEffect(() => {
    let returnTo = null;
    let openDialog = null;
    let lastOutside = null; // the last thing focused outside any dialog: where focus goes back to

    const onFocusIn = (e) => {
      if (!e.target.closest(OVERLAYS)) lastOutside = e.target;
    };
    document.addEventListener("focusin", onFocusIn);

    const sync = () => {
      const dialog = topDialog();
      if (dialog && dialog !== openDialog) {
        if (!openDialog) returnTo = lastOutside;
        openDialog = dialog;
        if (!dialog.contains(document.activeElement)) {
          const first = dialog.querySelector("input, select, textarea, button:not(.staff-topbar-logout)") || dialog;
          first.focus?.();
        }
      } else if (!dialog && openDialog) {
        openDialog = null;
        if (returnTo && document.contains(returnTo)) returnTo.focus?.();
        returnTo = null;
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    const onKey = (e) => {
      const dialog = topDialog();
      if (!dialog) return;
      if (e.key === "Escape") {
        e.preventDefault();
        const cancel = dialog.querySelector(".staff-confirm-actions button");
        if (cancel) cancel.click(); // confirm dialog: first button is Cancel
        else dialog.click(); // the overlay's own click closes the dialog
        return;
      }
      if (e.key === "Tab") {
        const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!dialog.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}
