<script lang="ts">
  import {
    createBackup, parseBackup, restoreBackup, backupFileName, BackupError,
  } from '@core/services/backup';

  // Export / import of all learner data (see core/services/backup.ts). Reads
  // window.localStorage directly rather than the StorageService seam: a backup is
  // a raw snapshot of the namespace, not a typed get/set of one key.

  type Status = { kind: 'ok' | 'err'; text: string } | null;
  let status = $state<Status>(null);
  let fileInput: HTMLInputElement;

  function exportProgress(): void {
    const backup = createBackup(window.localStorage);
    const count = Object.keys(backup.data).length;
    if (count === 0) {
      status = { kind: 'err', text: 'Es gibt noch keinen gespeicherten Fortschritt.' };
      return;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    status = { kind: 'ok', text: `Sicherung heruntergeladen (${count} Einträge).` };
  }

  async function importProgress(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('de-DE') : 'unbekannt';
      const ok = window.confirm(
        `Sicherung vom ${when} wiederherstellen?\n\n` +
        'Dein aktueller Fortschritt in diesem Browser wird dabei vollständig ersetzt.',
      );
      if (!ok) return;
      restoreBackup(window.localStorage, backup);
      status = { kind: 'ok', text: `Fortschritt wiederhergestellt (${Object.keys(backup.data).length} Einträge). Die Seite wird neu geladen …` };
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      status = {
        kind: 'err',
        text: e instanceof BackupError ? e.message : 'Die Datei konnte nicht gelesen werden.',
      };
    }
  }
</script>

<div class="backup">
  <section class="card panel">
    <h2>Sichern</h2>
    <p>Lädt deinen gesamten Fortschritt als JSON-Datei herunter: Ergebnisse, Karteikarten-Wiederholungen, Fehlerbuch, Lernpfad und Lernplan.</p>
    <p class="en">Downloads all your progress as a JSON file.</p>
    <button type="button" class="btn btn-primary" onclick={exportProgress}>Fortschritt herunterladen</button>
  </section>

  <section class="card panel">
    <h2>Wiederherstellen</h2>
    <p>Spielt eine Sicherungsdatei ein — z. B. in einem anderen Browser oder auf einem anderen Gerät. Der aktuelle Fortschritt hier wird ersetzt.</p>
    <p class="en">Restores a backup file, e.g. in another browser or on another device. Current progress here is replaced.</p>
    <button type="button" class="btn btn-secondary" onclick={() => fileInput.click()}>Sicherung einspielen …</button>
    <input bind:this={fileInput} type="file" accept="application/json,.json" onchange={importProgress} hidden />
  </section>

  {#if status}
    <p class="status" class:ok={status.kind === 'ok'} class:err={status.kind === 'err'} role="status">{status.text}</p>
  {/if}
</div>

<style>
  .backup { display: grid; gap: var(--space-4); max-width: var(--prose-max); }
  .panel { padding: var(--space-5); }
  .panel h2 { margin: 0 0 var(--space-2); font-size: var(--text-lg); }
  .panel p { margin: 0 0 var(--space-3); color: var(--text-muted); }
  .panel .en { font-size: var(--text-sm); color: var(--text-subtle); }
  .status { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius); border: 1px solid; }
  .ok { background: var(--ok-bg); border-color: var(--ok-border); color: var(--ok-fg); }
  .err { background: var(--err-bg); border-color: var(--err-border); color: var(--err-fg); }
</style>
