// ==UserScript==
// @name           Compact Sidebar by Site
// @description    Toggle Zen compact mode based on the site in the current tab.
// @include        main
// ==/UserScript==

(() => {
  "use strict";

  const PREF_HOSTS = "mod.compactbysite.hosts";
  const PREF_INVERT = "mod.compactbysite.invert";
  const PREF_COMPACT = "zen.view.compact.enable-at-startup";
  const PREF_HIDE_SIDEBAR = "zen.view.compact.hide-tabbar";
  const DEFAULT_HOSTS = "admin.shopify.com";

  // Make sure the prefs exist so they show up with sensible defaults.
  const defaults = Services.prefs.getDefaultBranch("");
  defaults.setStringPref(PREF_HOSTS, DEFAULT_HOSTS);
  defaults.setBoolPref(PREF_INVERT, false);

  function getHosts() {
    return Services.prefs
      .getStringPref(PREF_HOSTS, DEFAULT_HOSTS)
      .split(",")
      .map(h => h.trim().toLowerCase())
      .filter(Boolean);
  }

  function hostMatches(host, entry) {
    return host === entry || host.endsWith("." + entry);
  }

  // Returns true (compact), false (normal sidebar) or null (not a web page: leave alone).
  function wantCompact(uri) {
    if (!uri || !/^https?$/.test(uri.scheme)) return null;
    let host;
    try {
      host = uri.host.toLowerCase();
    } catch (e) {
      return null;
    }
    const listed = getHosts().some(entry => hostMatches(host, entry));
    return Services.prefs.getBoolPref(PREF_INVERT, false) ? !listed : listed;
  }

  function isCompact() {
    try {
      if (typeof gZenCompactModeManager !== "undefined") {
        return !!gZenCompactModeManager.preference;
      }
    } catch (e) {}
    return Services.prefs.getBoolPref(PREF_COMPACT, false);
  }

  function setCompact(enable) {
    if (isCompact() === enable) return;
    if (enable) {
      // Compact mode here means "hide the sidebar".
      Services.prefs.setBoolPref(PREF_HIDE_SIDEBAR, true);
    }
    try {
      if (typeof gZenCompactModeManager !== "undefined" && gZenCompactModeManager.toggle) {
        gZenCompactModeManager.toggle();
        return;
      }
    } catch (e) {
      console.error("[compact-by-site] toggle() failed, falling back to pref", e);
    }
    Services.prefs.setBoolPref(PREF_COMPACT, enable);
  }

  // Only act when the site "class" changes, so a manual toggle on the same
  // kind of site isn't immediately overridden.
  let lastWanted = null;
  function apply(uri) {
    const want = wantCompact(uri);
    console.log("[compact-by-site] url:", uri?.spec, "want compact:", want, "currently compact:", isCompact());
    if (want === null || want === lastWanted) return;
    lastWanted = want;
    setCompact(want);
  }

  const listener = {
    QueryInterface: ChromeUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),
    onLocationChange(webProgress, request, location, flags) {
      if (!webProgress.isTopLevel) return;
      if (flags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT) return;
      apply(location);
    },
  };

  gBrowser.addProgressListener(listener);
  gBrowser.tabContainer.addEventListener("TabSelect", () => {
    apply(gBrowser.selectedBrowser.currentURI);
  });

  // Reset the memo when the settings change so edits take effect right away.
  const observer = () => {
    lastWanted = null;
    apply(gBrowser.selectedBrowser.currentURI);
  };
  Services.prefs.addObserver(PREF_HOSTS, observer);
  Services.prefs.addObserver(PREF_INVERT, observer);

  window.addEventListener("unload", () => {
    gBrowser.removeProgressListener(listener);
    Services.prefs.removeObserver(PREF_HOSTS, observer);
    Services.prefs.removeObserver(PREF_INVERT, observer);
  }, { once: true });

  console.log("[compact-by-site] loaded");
  apply(gBrowser.selectedBrowser.currentURI);
})();
