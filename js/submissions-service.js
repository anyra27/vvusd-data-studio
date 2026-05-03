/**
 * SubmissionsService - Google Sheets-backed Submissions
 *
 * Drop-in replacement for the Firestore-based SubmissionsService.
 * Talks to a Google Apps Script web app that reads/writes Google Sheets.
 *
 * Same interface as the original so AdvancedModule + modules work unchanged:
 *   submit(moduleId, type, data)
 *   loadDistrictSubmissions(moduleId, type, limit)
 *   loadUserSubmissions(moduleId, type)
 *   onDistrictSubmissions(moduleId, type, callback)
 *   cleanup()
 */

// =====================================================================
// CONFIG — Update SCRIPT_URL after deploying your Apps Script web app
// =====================================================================
const CONFIG = {
    SCRIPT_URL: 'YOUR_APPS_SCRIPT_URL_HERE'
};

// Expose for pages that need to detect demo mode (e.g., gallery seed banner)
window.SUBMISSIONS_CONFIG = CONFIG;

window.SubmissionsService = {

    isDemoMode() {
        return !CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE';
    },

    _pollingIntervals: [],
    _cachedUserName: null,

    // =========================================================================
    // USER IDENTITY (localStorage-based, no Firebase auth)
    // =========================================================================

    _getUserName() {
        if (this._cachedUserName) return this._cachedUserName;
        const stored = localStorage.getItem('vcl_userName');
        if (stored) {
            this._cachedUserName = stored;
            return stored;
        }
        return 'Anonymous';
    },

    _getUserEmail() {
        return localStorage.getItem('vcl_userEmail') || '';
    },

    _getUserId() {
        let id = localStorage.getItem('vcl_userId');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('vcl_userId', id);
        }
        return id;
    },

    /**
     * Prompt user for their name if not already stored.
     * Returns true if we have a name, false if user cancelled.
     */
    _ensureUserIdentity() {
        if (localStorage.getItem('vcl_userName')) return true;

        const name = prompt('Enter your name for submissions:');
        if (!name || !name.trim()) return false;

        localStorage.setItem('vcl_userName', name.trim());
        this._cachedUserName = name.trim();

        const email = prompt('Enter your email (optional):');
        if (email && email.trim()) {
            localStorage.setItem('vcl_userEmail', email.trim());
        }

        return true;
    },

    // =========================================================================
    // CREATE
    // =========================================================================

    /**
     * Submit data to Google Sheets via Apps Script.
     * @param {string} moduleId
     * @param {string} type - 'poll', 'project', or 'feedback'
     * @param {Object} data - Type-specific payload
     */
    async submit(moduleId, type, data) {
        if (!this._ensureUserIdentity()) {
            throw new Error('User cancelled name entry');
        }

        const payload = {
            moduleId,
            type,
            userId: this._getUserId(),
            userName: this._getUserName(),
            userEmail: this._getUserEmail(),
            data: data || {}
        };

        // In demo mode, just log and pretend the write succeeded so the UX flow can be tested.
        if (this.isDemoMode()) {
            console.log('[DEMO MODE] submission would be sent:', payload);
            return { id: 'demo_' + Date.now(), ...payload, createdAt: new Date().toISOString() };
        }

        await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'no-cors'
        });

        // no-cors means we can't read the response, but the write will succeed
        return { id: 'local_' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    },

    // =========================================================================
    // READ
    // =========================================================================

    /**
     * Load all submissions for a given module + type from Google Sheets.
     */
    async loadDistrictSubmissions(moduleId, type, limit = 100) {
        try {
            const url = `${CONFIG.SCRIPT_URL}?action=getData&type=${encodeURIComponent(type)}&moduleId=${encodeURIComponent(moduleId)}&limit=${limit}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                return result.data;
            }
            return [];
        } catch (e) {
            console.error('SubmissionsService: Failed to load data', e);
            return [];
        }
    },

    /**
     * Load current user's submissions for a given module + type.
     */
    async loadUserSubmissions(moduleId, type) {
        const all = await this.loadDistrictSubmissions(moduleId, type);
        const userId = this._getUserId();
        return all.filter(item => item.userId === userId);
    },

    // =========================================================================
    // REAL-TIME (polling fallback — Sheets can't push)
    // =========================================================================

    /**
     * Simulate real-time updates by polling every 15 seconds.
     * Returns an unsubscribe function.
     */
    onDistrictSubmissions(moduleId, type, callback) {
        // Initial load
        this.loadDistrictSubmissions(moduleId, type).then(data => callback(data));

        // Poll every 15 seconds
        const intervalId = setInterval(() => {
            this.loadDistrictSubmissions(moduleId, type)
                .then(data => callback(data))
                .catch(() => {});
        }, 15000);

        this._pollingIntervals.push(intervalId);

        return () => {
            clearInterval(intervalId);
            this._pollingIntervals = this._pollingIntervals.filter(id => id !== intervalId);
        };
    },

    // =========================================================================
    // CLEANUP
    // =========================================================================

    cleanup() {
        this._pollingIntervals.forEach(id => clearInterval(id));
        this._pollingIntervals = [];
    },

    clearCache() {
        this.cleanup();
    }
};

// Also expose AuthService stub so the module's _getUserName()/_getUserEmail() work
window.AuthService = {
    getUser() {
        const name = localStorage.getItem('vcl_userName');
        if (!name) return null;
        return {
            displayName: name,
            email: localStorage.getItem('vcl_userEmail') || '',
            uid: SubmissionsService._getUserId()
        };
    },
    waitForAuth() {
        return Promise.resolve();
    },
    getUserId() {
        return SubmissionsService._getUserId();
    }
};
