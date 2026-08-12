"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  slug: string;
  fullName: string;
  title: string | null;
  photoUrl: string | null;
}

/**
 * Google-style typeahead for lecturer names. Renders a search input plus a
 * suggestion dropdown; it does NOT render its own <form>, so it can be dropped
 * inside an existing GET form (homepage hero, filter bar) and still submit
 * normally. Selecting a suggestion navigates straight to that lecturer's
 * profile.
 */
export function SearchAutocomplete({
  name = "q",
  defaultValue = "",
  placeholder,
  className,
  containerClassName,
  autoFocus,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Debounced fetch, cancelling any in-flight request so results can't arrive
  // out of order. All state updates happen in the (async) timeout callback so
  // nothing is set synchronously during the effect body.
  useEffect(() => {
    const q = value.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!q) {
        setItems([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/suggestions?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data: Suggestion[] = await res.json();
        setItems(data);
        setOpen(true);
        setActive(-1);
      } catch {
        // Ignore aborted/failed requests.
      }
    }, q ? 200 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goTo(s: Suggestion) {
    setOpen(false);
    router.push(`/giang-vien/${s.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      // Only intercept Enter when a suggestion is highlighted; otherwise let
      // the surrounding form submit a normal search.
      if (active >= 0 && active < items.length) {
        e.preventDefault();
        goTo(items[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${containerClassName ?? ""}`}>
      <input
        type="search"
        name={name}
        value={value}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Tìm kiếm giảng viên"
        role="combobox"
        aria-expanded={open}
        aria-controls="lecturer-suggestions"
        aria-autocomplete="list"
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        className={className}
      />

      {open && items.length > 0 && (
        <ul
          id="lecturer-suggestions"
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface py-1 text-left shadow-lg"
        >
          {items.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goTo(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-primary/10" : "hover:bg-background"
                }`}
              >
                <span className="text-muted">🔎</span>
                <span className="min-w-0 flex-1 truncate">{s.fullName}</span>
                {s.title && (
                  <span className="shrink-0 text-xs text-muted">{s.title}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
