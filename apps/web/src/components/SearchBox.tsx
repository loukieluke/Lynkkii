'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  return (
    <form className="searchbox" onSubmit={submit} role="search">
      <span aria-hidden>🔎</span>
      <input
        type="search"
        placeholder="Search events, artists, venues…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search events"
      />
      <button type="submit" className="btn btn--primary">
        Search
      </button>
    </form>
  );
}
