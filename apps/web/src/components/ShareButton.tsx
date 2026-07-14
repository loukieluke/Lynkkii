'use client';

export function ShareButton({ title, url }: { title: string; url: string }) {
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
      }
    } catch {
      /* user cancelled — ignore */
    }
  }
  return (
    <button type="button" className="btn btn--ghost" onClick={share}>
      ↗ Share
    </button>
  );
}
