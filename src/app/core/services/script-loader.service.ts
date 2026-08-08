import { Injectable } from '@angular/core';

/**
 * Loads third-party scripts from a CDN at runtime instead of via npm.
 *
 * Why: this workspace's node_modules lives on a mounted network drive that fails npm installs
 * with ENOTEMPTY rename errors on package updates (a filesystem quirk of the mount, not the
 * packages themselves). Loading libraries like jsPDF from a CDN on demand sidesteps that
 * entirely — nothing needs to be added to package.json or node_modules.
 */
@Injectable({ providedIn: 'root' })
export class ScriptLoaderService {
  private loaded = new Map<string, Promise<void>>();

  load(url: string): Promise<void> {
    let existing = this.loaded.get(url);
    if (existing) return existing;

    existing = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
    this.loaded.set(url, existing);
    return existing;
  }
}
