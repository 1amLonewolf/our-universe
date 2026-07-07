(function () {
  const SUPABASE_URL = 'https://hxstveexrqjieymeyixw.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_smJijxg8PcppwbIose7RSw_1rsVdFid';

  const DEFAULT_ITEMS = [
    {
      id: 'default-1',
      title: '❤️ First Hug',
      text: 'When time stood still and the world became ours.',
      image: './assets/first_hug.jpg',
      footer: 'July 2026 · Our beginning',
      isDefault: true
    },
    {
      id: 'default-2',
      title: '😂 Unstoppable Laughter',
      text: 'The night we could not stop laughing and every moment felt brighter.',
      image: './assets/laughing_together.jpg',
      footer: 'July 2026 · Joyful memories',
      isDefault: true
    },
    {
      id: 'default-3',
      title: '☕ Favorite Conversation',
      text: 'Cozy talks, unexpected confessions, and the feeling of coming home.',
      image: './assets/favorite_conversation.jpg',
      footer: 'June 2026 · Quiet evenings',
      isDefault: true
    },
    {
      id: 'default-4',
      title: '🌅 One Unforgettable Day',
      text: 'A sunset, a promise, and the kind of day you want to pause forever.',
      image: './assets/unforgettable_day.jpg',
      footer: 'July 2026 · Sunlit memories',
      isDefault: true
    },
    {
      id: 'default-5',
      title: '🤝 Holding Hands',
      text: 'A soft reminder of how steady and warm everything feels together.',
      image: './assets/my_hand.jpeg',
      footer: 'July 2026 · Close moments',
      isDefault: true
    },
    {
      id: 'default-6',
      title: '😊 Smiling Together',
      text: 'That effortless smile that makes every ordinary moment feel magical.',
      image: './assets/Smiley.jpeg',
      footer: 'July 2026 · Bright days',
      isDefault: true
    }
  ];

  class GalleryManager {
    constructor() {
      this.storageKey = 'our_universe_memory_trail_v2';
      this.remoteStorageKey = 'our_universe_memory_trail_remote_v2';
      this.supabaseUrlKey = 'our_universe_supabase_url';
      this.supabaseKeyKey = 'our_universe_supabase_anon_key';
      this.entries = [];
      this.containers = Array.from(document.querySelectorAll('.memory-trail'));
      this.remoteUrl = this.getRemoteUrl();
      this.supabaseUrl = this.getConfiguredSupabaseUrl();
      this.supabaseKey = this.getConfiguredSupabaseKey();
      this.supabaseClient = null;
      this.supabaseBucket = 'memories';
      this.supabaseTable = 'memories';
      this.lastSyncError = '';
      this.init();
    }

    showNotification(message, isError = false) {
      const existing = document.getElementById('gallery-sync-notification');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'gallery-sync-notification';
      toast.textContent = message;
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.zIndex = '5000';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '999px';
      toast.style.background = isError ? 'rgba(255, 78, 78, 0.95)' : 'rgba(0, 204, 122, 0.95)';
      toast.style.color = '#fff';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.26)';
      toast.style.maxWidth = '320px';
      toast.style.fontSize = '0.95rem';
      document.body.appendChild(toast);

      clearTimeout(this.notificationTimer);
      this.notificationTimer = window.setTimeout(() => {
        toast.remove();
      }, 3200);
    }

    init() {
      if (!this.containers.length) return;
      this.entries = this.loadEntries();
      this.bindUploadForm();
      this.bindCloudSyncControls();
      this.renderAll();
      this.renderCloudStatus();
    }

    bindUploadForm() {
      const form = document.getElementById('image-upload-form');
      if (!form) return;

      const imageInput = document.getElementById('image-input');
      const fileName = document.getElementById('file-name');
      const titleInput = document.getElementById('card-title-input');
      const textInput = document.getElementById('card-text-input');

      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        fileName.textContent = file ? file.name : 'No file selected';
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const file = imageInput.files[0];
        const title = titleInput.value.trim();
        const text = textInput.value.trim();

        if (!file) {
          alert('Please choose an image first.');
          return;
        }

        if (!title || !text) {
          alert('Add both a card title and card text.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target.result;
          this.addEntry({
            id: `upload-${Date.now()}`,
            title,
            text,
            image: imageData,
            footer: `Added ${new Date().toLocaleDateString()}`,
            isDefault: false
          });

          form.reset();
          fileName.textContent = 'No file selected';
          this.renderAll();
          this.exportMemories();
          if (window.synth && typeof window.synth.playChime === 'function') {
            window.synth.playChime();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    bindCloudSyncControls() {
      const input = document.getElementById('cloud-link-input');
      const keyInput = document.getElementById('cloud-key-input');
      const button = document.getElementById('cloud-sync-use-btn');
      const pushButton = document.getElementById('push-local-to-supabase-btn');
      const exportButton = document.getElementById('export-memories-btn');
      const importInput = document.getElementById('import-memories-input');
      if (!input || !keyInput) return;

      const storedUrl = localStorage.getItem(this.supabaseUrlKey);
      const storedKey = localStorage.getItem(this.supabaseKeyKey);
      const initialUrl = storedUrl || this.supabaseUrl || SUPABASE_URL;
      const initialKey = storedKey || this.supabaseKey || SUPABASE_ANON_KEY;
      input.value = initialUrl;
      keyInput.value = initialKey;

      if (button) {
        button.addEventListener('click', () => {
          const url = input.value.trim() || initialUrl;
          const key = keyInput.value.trim() || initialKey;
          if (url && key) {
            this.connectSupabase(url, key);
          } else {
            this.disconnectSupabase();
          }
        });
      }

      if (pushButton) {
        pushButton.addEventListener('click', () => {
          const url = input.value.trim() || initialUrl;
          const key = keyInput.value.trim() || initialKey;
          if (url && key) {
            this.showNotification('Starting local memory push…');
            this.connectSupabase(url, key);
          } else {
            this.disconnectSupabase();
            this.showNotification('Supabase credentials are missing.', true);
          }
        });
      }

      if (exportButton) {
        exportButton.addEventListener('click', () => this.exportMemories());
      }

      if (importInput) {
        importInput.addEventListener('change', (event) => {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result);
              if (!Array.isArray(parsed)) throw new Error('Invalid backup format');
              const importedEntries = parsed.filter((entry) => entry && entry.id);
              if (!importedEntries.length) {
                this.showNotification('No memories found in the selected file.', true);
                return;
              }
              this.entries = [...importedEntries, ...this.entries.filter((entry) => entry.isDefault)];
              this.saveEntries();
              this.renderAll();
              this.showNotification('Memories imported successfully.');
            } catch (error) {
              this.showNotification('Could not import memories.', true);
              console.error(error);
            } finally {
              importInput.value = '';
            }
          };
          reader.readAsText(file);
        });
      }

      if (initialUrl && initialKey) {
        this.connectSupabase(initialUrl, initialKey);
      }
    }

    connectSupabase(url, key) {
      const normalizedUrl = (url || '').trim();
      const normalizedKey = (key || '').trim();

      if (!normalizedUrl || !normalizedKey || !window.supabase) {
        this.renderCloudStatus('Supabase SDK not ready');
        return false;
      }

      if (this.supabaseClient && this.supabaseUrl === normalizedUrl && this.supabaseKey === normalizedKey) {
        this.renderCloudStatus('Supabase connected');
        return true;
      }

      this.supabaseUrl = normalizedUrl;
      this.supabaseKey = normalizedKey;

      if (!window.__ourUniverseSupabaseClient || window.__ourUniverseSupabaseClient.__ourUniverseUrl !== normalizedUrl || window.__ourUniverseSupabaseClient.__ourUniverseKey !== normalizedKey) {
        window.__ourUniverseSupabaseClient = window.supabase.createClient(normalizedUrl, normalizedKey);
        window.__ourUniverseSupabaseClient.__ourUniverseUrl = normalizedUrl;
        window.__ourUniverseSupabaseClient.__ourUniverseKey = normalizedKey;
      }

      this.supabaseClient = window.__ourUniverseSupabaseClient;
      this.lastSyncError = '';
      localStorage.setItem(this.supabaseUrlKey, normalizedUrl);
      localStorage.setItem(this.supabaseKeyKey, normalizedKey);
      this.renderCloudStatus('Connecting to Supabase…');
      this.loadSupabaseEntries().then(() => {
        const localEntries = this.getLocalEntries();
        if (localEntries.length) {
          this.entries = localEntries;
          this.renderAll();
          this.renderCloudStatus('Syncing local memories…');
          this.syncToSupabase(localEntries).then(() => {
            if (this.lastSyncError) {
              this.showNotification(`Push failed: ${this.lastSyncError}`, true);
            } else {
              this.showNotification('Local memories pushed to Supabase successfully.');
            }
          });
        } else {
          this.renderCloudStatus('Supabase connected');
        }
      });
      return true;
    }

    disconnectSupabase() {
      localStorage.removeItem(this.supabaseUrlKey);
      localStorage.removeItem(this.supabaseKeyKey);
      this.supabaseUrl = '';
      this.supabaseKey = '';
      window.__ourUniverseSupabaseClient = null;
      this.supabaseClient = null;
      this.renderCloudStatus('Local-only mode');
    }

    getConfiguredSupabaseUrl() {
      const stored = localStorage.getItem(this.supabaseUrlKey);
      return stored || SUPABASE_URL;
    }

    getConfiguredSupabaseKey() {
      const stored = localStorage.getItem(this.supabaseKeyKey);
      return stored || SUPABASE_ANON_KEY;
    }

    getLocalEntries() {
      try {
        const local = localStorage.getItem(this.storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            return parsed.filter((entry) => !entry.isDefault);
          }
        }
      } catch (error) {
        console.warn('Could not read local gallery data for sync.', error);
      }
      return [];
    }

    async withTimeout(promise, ms = 8000) {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    dataUrlToFile(dataUrl, filename) {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }

    async loadSupabaseEntries() {
      if (!this.supabaseClient) return null;
      try {
        const { data, error } = await this.withTimeout(this.supabaseClient
          .from(this.supabaseTable)
          .select('*')
          .order('created_at', { ascending: false }));

        if (error) throw error;
        if (Array.isArray(data) && data.length) {
          this.entries = data.map((item) => ({
            ...item,
            title: item.title || 'Untitled Memory',
            text: item.text || '',
            image: item.image_url || item.image || '',
            footer: item.footer || '',
            isDefault: false
          }));
          this.renderAll();
        }
        this.renderCloudStatus('Supabase connected');
        return data;
      } catch (error) {
        console.warn('Could not load Supabase entries.', error);
        this.renderCloudStatus('Supabase connection issue');
        return null;
      }
    }

    async saveSupabaseEntry(payload) {
      if (!this.supabaseClient) return { error: new Error('Supabase client not ready') };

      try {
        const { error } = await this.withTimeout(
          this.supabaseClient.from(this.supabaseTable).upsert(payload, { onConflict: 'id' })
        );

        if (!error) {
          return { error: null };
        }

        const message = error.message || '';
        const shouldFallback = /on conflict|unique|duplicate|constraint/i.test(message);
        if (!shouldFallback) {
          return { error };
        }

        const { data: existingRows, error: selectError } = await this.withTimeout(
          this.supabaseClient.from(this.supabaseTable).select('id').eq('id', payload.id).limit(1)
        );

        if (selectError) {
          return { error: selectError };
        }

        if (existingRows && existingRows.length) {
          const { error: updateError } = await this.withTimeout(
            this.supabaseClient.from(this.supabaseTable).update(payload).eq('id', payload.id)
          );
          return { error: updateError };
        }

        const { error: insertError } = await this.withTimeout(
          this.supabaseClient.from(this.supabaseTable).insert(payload)
        );
        return { error: insertError };
      } catch (error) {
        return { error };
      }
    }

    async syncToSupabase(entriesOverride = null) {
      if (!this.supabaseClient) return;
      const userEntries = (entriesOverride || this.entries).filter((entry) => !entry.isDefault);
      let failed = [];

      for (const entry of userEntries) {
        if (!entry.id) continue;

        let imageUrl = entry.image;
        if (entry.image && entry.image.startsWith('data:image')) {
          try {
            const fileName = `${entry.id}-${Date.now()}.jpg`;
            const file = this.dataUrlToFile(entry.image, fileName);
            const filePath = `${entry.id}-${Date.now()}`;
            const { data: uploadData, error: uploadError } = await this.withTimeout(this.supabaseClient.storage
              .from(this.supabaseBucket)
              .upload(filePath, file, { cacheControl: '3600', upsert: true }));

            if (uploadError) throw uploadError;
            const { data: publicData } = this.supabaseClient.storage
              .from(this.supabaseBucket)
              .getPublicUrl(uploadData.path);
            imageUrl = publicData.publicUrl;
          } catch (error) {
            failed.push(error.message || 'Image upload failed');
            console.error('Supabase image upload failed:', error);
          }
        }

        const payload = {
          id: entry.id,
          title: entry.title || '',
          text: entry.text || '',
          image_url: imageUrl || '',
          footer: entry.footer || '',
          created_at: entry.created_at || new Date().toISOString()
        };

        const { error } = await this.saveSupabaseEntry(payload);
        if (error) {
          const message = error.message || 'Database sync failed';
          failed.push(message);
          console.error('Supabase database write failed:', error);
        }
      }

      if (failed.length) {
        this.lastSyncError = failed[0];
        this.renderCloudStatus(`Sync failed: ${this.lastSyncError}`);
        this.showNotification(`Push failed: ${this.lastSyncError}`, true);
      } else {
        this.lastSyncError = '';
        this.renderCloudStatus('Supabase connected');
      }
    }

    async deleteSupabaseEntry(id) {
      if (!this.supabaseClient) return;
      const { error } = await this.supabaseClient.from(this.supabaseTable).delete().eq('id', id);
      if (error) {
        console.warn('Could not delete Supabase row.', error);
      }
    }

    addEntry(entry) {
      this.entries.unshift({ ...entry, created_at: entry.created_at || new Date().toISOString() });
      this.saveEntries();
    }

    updateEntry(id, updates) {
      this.entries = this.entries.map((entry) => entry.id === id ? { ...entry, ...updates } : entry);
      this.saveEntries();
      this.renderAll();
    }

    deleteEntry(id) {
      if (!confirm('Delete this memory card?')) return;
      const deletedEntry = this.entries.find((entry) => entry.id === id);
      this.entries = this.entries.filter((entry) => entry.id !== id);
      this.saveEntries();
      this.renderAll();
      if (this.supabaseClient && deletedEntry && !deletedEntry.isDefault) {
        this.deleteSupabaseEntry(id);
      }
      if (window.synth && typeof window.synth.playClick === 'function') {
        window.synth.playClick();
      }
    }

    loadEntries() {
      try {
        const local = localStorage.getItem(this.storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Could not read local gallery data.', error);
      }

      if (this.supabaseClient) {
        this.loadSupabaseEntries();
      }

      return DEFAULT_ITEMS.slice();
    }

    saveEntries() {
      const payload = JSON.stringify(this.entries);
      localStorage.setItem(this.storageKey, payload);
      if (this.supabaseClient) {
        this.syncToSupabase();
      }
    }

    exportMemories() {
      const exportPayload = JSON.stringify(this.entries, null, 2);
      const blob = new Blob([exportPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'our-universe-memories.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      this.showNotification('Memories exported successfully.');
    }

    getRemoteUrl() {
      const params = new URLSearchParams(window.location.search);
      const explicit = params.get('gallery');
      if (explicit) {
        return explicit.startsWith('http') ? explicit : `https://jsonblob.com/api/jsonblobs/${explicit}`;
      }

      const stored = localStorage.getItem(this.remoteStorageKey);
      return stored || '';
    }

    async syncToRemote(payload) {
      const remoteUrl = this.remoteUrl || this.getRemoteUrl();
      if (!remoteUrl) {
        try {
          const response = await fetch('https://jsonblob.com/api/jsonBlob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
          });

          if (response.ok) {
            const url = response.headers.get('Location') || response.headers.get('location');
            if (url) {
              this.remoteUrl = url;
              localStorage.setItem(this.remoteStorageKey, url);
              this.renderCloudStatus();
            }
          }
        } catch (error) {
          console.warn('Remote sync failed, using local storage only.', error);
        }
        return;
      }

      try {
        await fetch(remoteUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
        this.renderCloudStatus();
      } catch (error) {
        console.warn('Remote sync update failed.', error);
      }
    }

    renderAll() {
      this.containers.forEach((container) => this.renderInto(container));
    }

    renderInto(container) {
      container.innerHTML = '';

      if (!this.entries.length) {
        container.innerHTML = '<div class="gallery-empty-state">No memories yet.</div>';
        return;
      }

      this.entries.forEach((entry) => {
        const card = document.createElement('div');
        card.className = 'trail-card';
        card.innerHTML = `
          <div class="trail-card-image">
            <img src="${entry.image}" alt="${this.escapeHtml(entry.title)}">
            <div class="card-hint">Double tap for full image view</div>
          </div>
          <div class="trail-card-content">
            <div class="trail-card-meta">
              <div class="trail-dot"></div>
              <div>
                <div class="trail-card-title">${this.escapeHtml(entry.title)}</div>
                <p class="trail-card-text">${this.escapeHtml(entry.text)}</p>
              </div>
            </div>
            <div class="trail-card-footer">${this.escapeHtml(entry.footer || '')}</div>
            <div class="trail-card-actions">
              <button class="card-action-btn edit" data-id="${entry.id}" title="Edit">✎</button>
              <button class="card-action-btn delete" data-id="${entry.id}" title="Delete">✕</button>
            </div>
          </div>
        `;

        const imageEl = card.querySelector('.trail-card-image img');
        imageEl.addEventListener('dblclick', () => this.openPreview(entry));
        let lastTap = 0;
        imageEl.addEventListener('touchstart', (event) => {
          const now = Date.now();
          if (now - lastTap < 280) {
            event.preventDefault();
            this.openPreview(entry);
          }
          lastTap = now;
        }, { passive: false });

        card.querySelector('.card-action-btn.edit').addEventListener('click', () => this.openEditor(entry.id));
        card.querySelector('.card-action-btn.delete').addEventListener('click', () => this.deleteEntry(entry.id));
        container.appendChild(card);
      });
    }

    openPreview(entry) {
      const overlay = document.createElement('div');
      overlay.className = 'gallery-preview-overlay';
      overlay.innerHTML = `
        <div class="gallery-preview-card">
          <button class="gallery-preview-close" type="button">×</button>
          <img src="${entry.image}" alt="${this.escapeHtml(entry.title)}">
          <div class="gallery-preview-body">
            <h3>${this.escapeHtml(entry.title)}</h3>
            <p>${this.escapeHtml(entry.text)}</p>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.gallery-preview-close').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.remove();
      });
    }

    openEditor(id) {
      const entry = this.entries.find((item) => item.id === id);
      if (!entry) return;

      const overlay = document.createElement('div');
      overlay.className = 'gallery-editor-overlay';
      overlay.innerHTML = `
        <div class="gallery-editor-panel">
          <div class="gallery-editor-header">
            <h3>Edit Memory</h3>
            <button class="gallery-editor-close" type="button">×</button>
          </div>
          <div class="gallery-editor-body">
            <div class="gallery-editor-preview">
              <img src="${entry.image}" alt="Preview">
            </div>
            <label class="editor-field">
              <span>Card Title</span>
              <input type="text" class="editor-input" id="editor-title" value="${this.escapeHtml(entry.title)}">
            </label>
            <label class="editor-field">
              <span>Card Text</span>
              <textarea class="editor-input editor-textarea" id="editor-text">${this.escapeHtml(entry.text)}</textarea>
            </label>
            <label class="editor-field">
              <span>Replace Image</span>
              <input type="file" id="editor-image" accept="image/*">
            </label>
            <div class="editor-actions">
              <button class="btn-upload" type="button" id="save-editor">Save</button>
              <button class="card-action-btn delete" type="button" id="delete-editor">Delete</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      overlay.querySelector('.gallery-editor-close').addEventListener('click', () => overlay.remove());
      overlay.querySelector('#save-editor').addEventListener('click', () => {
        const title = overlay.querySelector('#editor-title').value.trim();
        const text = overlay.querySelector('#editor-text').value.trim();
        const imageInput = overlay.querySelector('#editor-image');
        const file = imageInput.files[0];

        if (!title || !text) {
          alert('Please fill both the title and the card text.');
          return;
        }

        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.updateEntry(entry.id, {
              title,
              text,
              image: event.target.result,
              footer: entry.footer || `Updated ${new Date().toLocaleDateString()}`
            });
            overlay.remove();
          };
          reader.readAsDataURL(file);
        } else {
          this.updateEntry(entry.id, { title, text });
          overlay.remove();
        }
      });

      overlay.querySelector('#delete-editor').addEventListener('click', () => {
        this.deleteEntry(entry.id);
        overlay.remove();
      });
    }

    renderCloudStatus(message = '') {
      const statusEl = document.getElementById('cloud-sync-status');
      if (!statusEl) return;
      if (message) {
        statusEl.textContent = message;
        statusEl.className = 'cloud-sync-status active';
        statusEl.title = this.lastSyncError || '';
        return;
      }
      if (this.supabaseClient) {
        statusEl.textContent = 'Supabase connected';
        statusEl.className = 'cloud-sync-status active';
      } else {
        statusEl.textContent = 'Local-only mode';
        statusEl.className = 'cloud-sync-status';
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }
  }

  window.GalleryManager = GalleryManager;
  document.addEventListener('DOMContentLoaded', () => {
    new GalleryManager();
  });
})();
