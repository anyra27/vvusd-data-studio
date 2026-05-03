/**
 * Lazy Video Loading
 * Uses Intersection Observer to defer video loading until visible
 * Improves initial page load on both mobile and desktop
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01
    };

    // Track initialized videos to prevent double-loading
    const loadedVideos = new WeakSet();

    /**
     * Load a video by setting the actual src on its source elements
     */
    function loadVideo(video) {
        if (loadedVideos.has(video)) return;
        loadedVideos.add(video);

        const sources = video.querySelectorAll('source[data-src]');
        sources.forEach(source => {
            source.src = source.dataset.src;
            source.removeAttribute('data-src');
        });

        // Also check for data-src on the video itself
        if (video.dataset.src) {
            video.src = video.dataset.src;
            video.removeAttribute('data-src');
        }

        // Trigger load
        video.load();

        // If autoplay is set, play when ready
        if (video.hasAttribute('autoplay')) {
            video.play().catch(() => {
                // Autoplay may be blocked by browser, that's fine
            });
        }

        video.classList.add('lazy-loaded');
    }

    /**
     * Initialize Intersection Observer for lazy loading
     */
    let observer = null;

    function getObserver() {
        if (observer) return observer;

        if (!('IntersectionObserver' in window)) {
            // Fallback: load all videos immediately on unsupported browsers
            return null;
        }

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    loadVideo(video);
                    observer.unobserve(video);
                }
            });
        }, config);

        return observer;
    }

    /**
     * Observe a video element for lazy loading
     */
    function observeVideo(video) {
        const obs = getObserver();
        if (obs) {
            obs.observe(video);
        } else {
            // Fallback: load immediately
            loadVideo(video);
        }
    }

    /**
     * Scan a container for videos with data-src and set up lazy loading
     * Call this after dynamically inserting content
     */
    function initLazyVideos(container = document) {
        // Find videos that have source elements with data-src
        const videos = container.querySelectorAll('video');

        videos.forEach(video => {
            const hasLazySources = video.querySelector('source[data-src]');
            const hasLazySrc = video.dataset.src;

            if (hasLazySources || hasLazySrc) {
                // Remove autoplay temporarily to prevent browser from trying to play empty video
                const wasAutoplay = video.hasAttribute('autoplay');
                if (wasAutoplay) {
                    video.setAttribute('data-autoplay', 'true');
                }

                observeVideo(video);
            }
        });
    }

    /**
     * Convert existing videos to lazy loading format
     * Useful for videos already in the DOM with src set
     * Call this early, before videos start loading
     */
    function convertToLazy(container = document) {
        const videos = container.querySelectorAll('video:not(.lazy-converted)');

        videos.forEach(video => {
            // Skip if already loaded/playing
            if (video.readyState > 0) return;

            const sources = video.querySelectorAll('source[src]');
            let converted = false;

            sources.forEach(source => {
                if (source.src && !source.dataset.src) {
                    source.dataset.src = source.src;
                    source.removeAttribute('src');
                    converted = true;
                }
            });

            // Also handle src on video element itself
            if (video.src && !video.dataset.src) {
                video.dataset.src = video.src;
                video.removeAttribute('src');
                converted = true;
            }

            if (converted) {
                video.classList.add('lazy-converted');
                observeVideo(video);
            }
        });
    }

    /**
     * Pause videos that are not visible to save resources
     * Call this to optimize performance when scrolling
     */
    function pauseOffscreenVideos(container = document) {
        const videos = container.querySelectorAll('video');

        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0
            );

            if (!isVisible && !video.paused) {
                video.pause();
            } else if (isVisible && video.paused && video.hasAttribute('autoplay')) {
                video.play().catch(() => {});
            }
        });
    }

    // Expose globally
    window.LazyVideo = {
        init: initLazyVideos,
        convert: convertToLazy,
        load: loadVideo,
        pauseOffscreen: pauseOffscreenVideos
    };

    // Auto-initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initLazyVideos());
    } else {
        initLazyVideos();
    }
})();
