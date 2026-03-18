# GTranslate Dictionary

**Version:** 1.1.0  
**Author:** [Adrián González](https://github.com/adrianglezdev)  
**License:** GPL v2  
**Requires WordPress:** 6.5+  
**Requires PHP:** 7.0+

---

## What does this plugin do?

GTranslate Dictionary lets you define custom word and phrase overrides for the [GTranslate](https://wordpress.org/plugins/gtranslate/) plugin. Instead of relying entirely on automatic translations, you can build a per-language dictionary from a visual interface — no coding required.

When a visitor switches language on your site, the plugin intercepts GTranslate's output and replaces specific words or phrases with your own preferred translations.

**Example:** GTranslate translates "Services" as "Servicios" but you want it to say "Nuestros Servicios" — just add it to the dictionary and it will be replaced automatically.

---

## Requirements

- WordPress 6.5 or higher
- PHP 7.0 or higher
- The [GTranslate](https://wordpress.org/plugins/gtranslate/) plugin installed and active

---

## Installation

### Step 1 — Download the plugin

Go to the [Releases page on GitHub](https://github.com/adrianglezdev/gtranslate-dictionary/releases/tag/v1.0.0) and download the latest `.zip` file.

> Make sure you download the file named `gtranslate-dictionary.zip`, not the source code archive.

### Step 2 — Upload to WordPress

1. Log in to your WordPress admin panel
2. Go to **Plugins → Add New**
3. Click **Upload Plugin** at the top of the page
4. Click **Choose File** and select the `gtranslate-dictionary.zip` file you downloaded
5. Click **Install Now**
6. Once installed, click **Activate Plugin**

### Step 3 — Verify activation

After activation, you should see a new menu item called **GT Dictionary** in your WordPress sidebar. If you see it, the plugin is ready to use.

---

## How to use it

### Opening the dictionary

Click **GT Dictionary** in the WordPress admin sidebar. This opens the dictionary manager.

### Adding a language

1. Click the **"Select a language to add"** dropdown
2. Choose the language you want to configure (e.g. English, Français, Deutsch…)
3. Click **+ Add language**

A new card will appear for that language.

### Adding word overrides

Inside each language card:

1. Click the **"GT translation…"** field and type the word or phrase exactly as GTranslate translates it
2. Click the **"Your override…"** field and type the word or phrase you want to display instead
3. Click the **+** button (or press **Enter**) to add the entry

> **How to find the exact GTranslate translation:** switch your site to the target language, right-click the text you want to override, click **Inspect**, and copy the exact text from the HTML. That is what you need to enter in the "GT translation" field — it must match character by character.

### Editing existing entries

Click directly on any entry in the table to edit it inline. Changes are tracked automatically.

### Saving the dictionary

Click **💾 Save dictionary** to save all your changes.

> ⚠️ **Important: clear your cache after saving.** If your site uses a caching plugin (WP Super Cache, W3 Total Cache, LiteSpeed Cache, WP Rocket, etc.) or a CDN, you must clear the cache every time you save changes to the dictionary. Otherwise visitors may still see the old translations until the cache expires.

### Removing a language

Click the **✕ Remove** button on any language card to delete that language and all its entries. Then save.

---

## How the overrides work on the frontend

Once saved, the plugin automatically injects a small JavaScript snippet into your site's footer. This script:

1. Detects the active language (via GTranslate's cookie or URL parameter)
2. Waits for GTranslate to finish translating the page
3. Scans the page text and replaces any matching words or phrases with your overrides

No shortcodes or template changes are needed — it works automatically on every page.

---

## Frequently asked questions

**Do I need the paid version of GTranslate?**  
No. This plugin works with the free version of GTranslate.

**Are overrides case-sensitive?**  
Yes. `"Services"` and `"services"` are treated as different entries. If GTranslate produces both variants, add both to the dictionary.

**The override is not appearing on my site — what should I check?**  
1. Make sure you saved the dictionary after adding the entry
2. Clear your site cache and CDN cache
3. Switch the language on the frontend and check that the exact source text matches what GTranslate produces (use browser DevTools to inspect)
4. Check that the GTranslate plugin is active and working

**Can I add overrides for multiple languages?**  
Yes. Add as many language cards as you need, each with its own set of overrides.

**Will this plugin slow down my site?**  
No. The injected script is minimal and uses a debounced MutationObserver, so it has negligible impact on performance.

---

## Changelog

### 1.0.0 — Initial release
- Visual dictionary manager in the WordPress admin
- Per-language word and phrase overrides
- Automatic frontend injection via JavaScript
- Compatible with GTranslate free widget

---

## License

This plugin is licensed under the [GNU General Public License v2](https://es.wordpress.org/about/license/).
