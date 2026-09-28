import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface LazyRevealProps<Q> {
  question: Q;
  renderReveal: (question: Q) => ReactNode;
  placeholder: ReactNode;
}

export function LazyReveal<Q>({ question, renderReveal, placeholder }: LazyRevealProps<Q>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (visible) return <>{renderReveal(question)}</>;
  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-4">
      {placeholder}
    </div>
  );
}
