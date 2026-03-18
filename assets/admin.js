/* GTranslate Dictionary — Admin UI v1.1.0 */
(function ($) {
    'use strict';

    // ── Estado global ────────────────────────────────────────────────────────
    var state = {
        dict:        {},
        open:        {},
        sourceLang:  'es',
        dirty:       false
    };

    // ── Arranque ─────────────────────────────────────────────────────────────
    $(function () {
        try {
            var parsed = JSON.parse(GTD.dict_json || '{}');
            state.dict = (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
                ? parsed : {};
        } catch(e) {
            state.dict = {};
        }

        state.sourceLang = GTD.source_lang || 'es';

        Object.keys(state.dict).forEach(function(l) {
            state.open[l] = Object.keys(state.dict[l]).length > 0;
        });

        render();
        bindEvents();
    });

    // ── Render completo ───────────────────────────────────────────────────────
    function render() {
        var langs        = Object.keys(state.dict);
        var totalEntries = countAllEntries();
        var html         = '';

        // Cabecera
        html += '<div class="gtd-header">'
             +    '<div class="gtd-header-left">'
             +      '<div class="gtd-logo">🌐</div>'
             +      '<div>'
             +        '<p class="gtd-title">Translation Dictionary</p>'
             +        '<p class="gtd-subtitle">Custom overrides for GTranslate — manage per language</p>'
             +      '</div>'
             +    '</div>'
             +    '<div class="gtd-save-bar">'
             +      '<span class="gtd-save-msg" id="gtd-save-msg"></span>'
             +      '<button class="gtd-btn gtd-btn-primary" id="gtd-save-btn">'
             +        (state.dirty ? '💾 Save dictionary *' : '💾 Save dictionary')
             +      '</button>'
             +    '</div>'
             +  '</div>';

        // Source language selector
        html += '<div class="gtd-source-lang-bar">'
             +    '<div class="gtd-source-lang-inner">'
             +      '<span class="gtd-source-lang-label">🏠 Source language <span class="gtd-source-lang-hint">(the base language of your site)</span></span>'
             +      '<div class="gtd-source-lang-controls">'
             +        '<select class="gtd-select" id="gtd-source-lang-select">';

        Object.keys(GTD.langs).forEach(function(code) {
            var selected = code === state.sourceLang ? ' selected' : '';
            html += '<option value="' + esc(code) + '"' + selected + '>' + esc(GTD.langs[code]) + ' (' + code + ')</option>';
        });

        html +=       '</select>'
             +        '<button class="gtd-btn gtd-btn-ghost gtd-btn-sm" id="gtd-save-source-btn">Save</button>'
             +        '<span class="gtd-source-saved" id="gtd-source-saved"></span>'
             +      '</div>'
             +    '</div>'
             +  '</div>';

        // Stats
        html += '<div class="gtd-stats">'
             +    '<div class="gtd-stat"><div class="gtd-stat-num" id="gtd-count-langs">' + langs.length + '</div><div class="gtd-stat-lbl">Languages configured</div></div>'
             +    '<div class="gtd-stat"><div class="gtd-stat-num" id="gtd-count-entries">' + totalEntries + '</div><div class="gtd-stat-lbl">Total overrides</div></div>'
             +    '<div class="gtd-stat"><div class="gtd-stat-num gtd-stat-lang">' + esc(state.sourceLang.toUpperCase()) + '</div><div class="gtd-stat-lbl">Source language</div></div>'
             +  '</div>';

        // Añadir idioma
        html += '<div class="gtd-add-lang-bar">'
             +    '<select class="gtd-select" id="gtd-lang-select">'
             +      '<option value="">— Select a target language to add —</option>';
        Object.keys(GTD.langs).forEach(function(code) {
            // Exclude the source language from target options
            if (!state.dict.hasOwnProperty(code) && code !== state.sourceLang) {
                html += '<option value="' + esc(code) + '">' + esc(GTD.langs[code]) + ' (' + code + ')</option>';
            }
        });
        html +=   '</select>'
             +    '<button class="gtd-btn gtd-btn-ghost" id="gtd-add-lang-btn">+ Add language</button>'
             +  '</div>';

        // Tarjetas de idioma
        if (langs.length === 0) {
            html += '<div class="gtd-empty">'
                 +    '<div class="gtd-empty-icon">📖</div>'
                 +    '<h3>Your dictionary is empty</h3>'
                 +    '<p>Select a target language above and start adding custom translations.</p>'
                 +  '</div>';
        } else {
            langs.forEach(function(lang) {
                html += buildCard(lang);
            });
        }

        $('#gtd-app').html(html);
    }

    // ── Construir HTML de una tarjeta de idioma ───────────────────────────────
    function buildCard(lang) {
        var entries  = state.dict[lang] || {};
        var keys     = Object.keys(entries);
        var isOpen   = !!state.open[lang];
        var langName = GTD.langs[lang] || lang;
        var count    = keys.length;

        var h = '<div class="gtd-lang-card" data-lang="' + esc(lang) + '">';

        h += '<div class="gtd-lang-header" data-lang="' + esc(lang) + '">'
           +   '<div class="gtd-lang-title">'
           +     '<span class="gtd-lang-tag">' + esc(state.sourceLang.toUpperCase()) + '</span>'
           +     '<span class="gtd-lang-arrow">→</span>'
           +     '<span class="gtd-lang-tag gtd-lang-tag-target">' + esc(lang.toUpperCase()) + '</span>'
           +     '<span class="gtd-lang-name">' + esc(langName) + '</span>'
           +     '<span class="gtd-entry-count" data-count="' + esc(lang) + '">' + count + ' override' + (count !== 1 ? 's' : '') + '</span>'
           +   '</div>'
           +   '<div class="gtd-lang-actions">'
           +     '<button class="gtd-btn gtd-btn-danger gtd-remove-lang" data-lang="' + esc(lang) + '">✕ Remove</button>'
           +     '<span class="gtd-chevron' + (isOpen ? ' open' : '') + '" data-chevron="' + esc(lang) + '">⌄</span>'
           +   '</div>'
           + '</div>';

        h += '<div class="gtd-entries' + (isOpen ? ' open' : '') + '" data-entries="' + esc(lang) + '">';

        if (count > 0) {
            h += '<div class="gtd-entries-header">'
               +   '<span>' + esc(GTD.langs[state.sourceLang] || state.sourceLang) + ' (GT output)</span>'
               +   '<span>' + esc(langName) + ' override</span>'
               +   '<span></span>'
               + '</div>';
            keys.forEach(function(from) {
                h += buildEntryRow(lang, from, entries[from]);
            });
        }

        h += '<div class="gtd-add-row">'
           +   '<input class="gtd-input gtd-new-from" type="text" placeholder="GT translation…" data-lang="' + esc(lang) + '" autocomplete="off" />'
           +   '<input class="gtd-input gtd-new-to"   type="text" placeholder="Your override…"  data-lang="' + esc(lang) + '" autocomplete="off" />'
           +   '<button class="gtd-add-btn gtd-add-entry" data-lang="' + esc(lang) + '" title="Add entry">+</button>'
           + '</div>';

        h += '</div></div>';
        return h;
    }

    function buildEntryRow(lang, from, to) {
        return '<div class="gtd-entry-row" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '">'
             + '<input class="gtd-input gtd-edit-from" type="text" value="' + esc(from) + '" data-lang="' + esc(lang) + '" data-orig="' + esc(from) + '" />'
             + '<input class="gtd-input gtd-edit-to"   type="text" value="' + esc(to)   + '" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '" />'
             + '<button class="gtd-del-btn gtd-del-entry" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '" title="Delete">✕</button>'
             + '</div>';
    }

    // ── Render parcial ────────────────────────────────────────────────────────
    function refreshCard(lang) {
        var $card = $('.gtd-lang-card[data-lang="' + lang + '"]');
        if ($card.length) $card.replaceWith(buildCard(lang));
        refreshCounters();
    }

    function refreshCounters() {
        var total = countAllEntries();
        var langs = Object.keys(state.dict);
        $('#gtd-count-langs').text(langs.length);
        $('#gtd-count-entries').text(total);
        $('.gtd-stat-lang').text(state.sourceLang.toUpperCase());
        langs.forEach(function(lang) {
            var count = Object.keys(state.dict[lang]).length;
            $('[data-count="' + lang + '"]').text(count + ' override' + (count !== 1 ? 's' : ''));
        });
    }

    function countAllEntries() {
        var total = 0;
        Object.keys(state.dict).forEach(function(l) { total += Object.keys(state.dict[l]).length; });
        return total;
    }

    // ── Eventos ───────────────────────────────────────────────────────────────
    function bindEvents() {

        // Guardar diccionario
        $(document).on('click', '#gtd-save-btn', saveDictionary);

        // Guardar idioma origen
        $(document).on('click', '#gtd-save-source-btn', saveSourceLang);

        // No actualizamos sourceLang en onChange — esperamos al click de Save
        // para poder mostrar el aviso de borrado antes de comprometerse.

        // Añadir idioma destino
        $(document).on('click', '#gtd-add-lang-btn', function () {
            var lang = $('#gtd-lang-select').val();
            if (!lang || state.dict.hasOwnProperty(lang)) return;
            state.dict[lang] = {};
            state.open[lang] = true;
            markDirty();
            render();
        });

        // Toggle tarjeta
        $(document).on('click', '.gtd-lang-header', function (e) {
            if ($(e.target).closest('.gtd-remove-lang').length) return;
            var lang = $(this).data('lang');
            state.open[lang] = !state.open[lang];
            $('[data-entries="' + lang + '"]').toggleClass('open', state.open[lang]);
            $('[data-chevron="' + lang + '"]').toggleClass('open', state.open[lang]);
        });

        // Eliminar idioma
        $(document).on('click', '.gtd-remove-lang', function (e) {
            e.stopPropagation();
            var lang = $(this).data('lang');
            if (!confirm(GTD.strings.confirm_del + '\n\n' + (GTD.langs[lang] || lang))) return;
            delete state.dict[lang];
            delete state.open[lang];
            markDirty();
            render();
        });

        // Añadir entrada
        $(document).on('click', '.gtd-add-entry', function () {
            addEntry($(this).data('lang'));
        });
        $(document).on('keydown', '.gtd-new-from, .gtd-new-to', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); addEntry($(this).data('lang')); }
        });

        // Eliminar entrada
        $(document).on('click', '.gtd-del-entry', function () {
            var lang = $(this).data('lang');
            var from = $(this).data('from');
            if (!state.dict[lang]) return;
            delete state.dict[lang][from];
            markDirty();
            refreshCard(lang);
        });

        // Editar from
        $(document).on('change', '.gtd-edit-from', function () {
            var lang    = $(this).data('lang');
            var orig    = $(this).data('orig');
            var newFrom = $.trim($(this).val());
            if (!newFrom || newFrom === orig) { $(this).val(orig); return; }
            if (!state.dict[lang]) return;
            if (state.dict[lang].hasOwnProperty(newFrom)) {
                alert('That key already exists.');
                $(this).val(orig);
                return;
            }
            var oldVal = state.dict[lang][orig];
            delete state.dict[lang][orig];
            state.dict[lang][newFrom] = oldVal;
            markDirty();
            refreshCard(lang);
        });

        // Editar to
        $(document).on('change', '.gtd-edit-to', function () {
            var lang = $(this).data('lang');
            var from = $(this).data('from');
            if (!state.dict[lang]) return;
            state.dict[lang][from] = $.trim($(this).val());
            markDirty();
        });
    }

    // ── Añadir entrada ────────────────────────────────────────────────────────
    function addEntry(lang) {
        var $from = $('.gtd-new-from[data-lang="' + lang + '"]');
        var $to   = $('.gtd-new-to[data-lang="' + lang + '"]');
        var from  = $.trim($from.val());
        var to    = $.trim($to.val());

        $from.removeClass('error');
        $to.removeClass('error');

        if (!from) { $from.addClass('error').focus(); return; }
        if (!to)   { $to.addClass('error').focus();   return; }

        if (!state.dict[lang]) state.dict[lang] = {};
        state.dict[lang][from] = to;
        state.open[lang] = true;
        markDirty();
        refreshCard(lang);
    }

    // ── Guardar idioma origen ─────────────────────────────────────────────────
    function saveSourceLang() {
        var lang = $('#gtd-source-lang-select').val();
        if (!lang) return;

        // If language hasn't changed, nothing to do
        if (lang === state.sourceLang) return;

        // Warn the user that all entries will be wiped
        var hasEntries = Object.keys(state.dict).length > 0;
        if (hasEntries) {
            var confirmed = confirm(
                'Warning: changing the source language will delete ALL your current dictionary entries.\n\n' +
                'This cannot be undone.\n\nDo you want to continue?'
            );
            if (!confirmed) {
                // Reset the select back to current value
                $('#gtd-source-lang-select').val(state.sourceLang);
                return;
            }
        }

        var $btn = $('#gtd-save-source-btn');
        var $msg = $('#gtd-source-saved');
        $btn.prop('disabled', true).text('Saving…');

        $.post(GTD.ajax_url, {
            action:      'gtd_save_source_lang',
            nonce:       GTD.nonce,
            source_lang: lang
        })
        .done(function(res) {
            if (res.success) {
                // Wipe local state too
                state.sourceLang = lang;
                state.dict       = {};
                state.open       = {};
                state.dirty      = false;
                $msg.text('\u2713 Saved \u2014 clear your cache!').addClass('show');
                setTimeout(function() { $msg.removeClass('show').text(''); }, 4000);
                render();
            }
        })
        .always(function() {
            $btn.prop('disabled', false).text('Save');
        });
    }

    // ── Guardar diccionario ───────────────────────────────────────────────────
    function saveDictionary() {
        $('.gtd-edit-to').each(function () {
            var lang = $(this).data('lang');
            var from = $(this).data('from');
            if (lang && from && state.dict[lang]) {
                state.dict[lang][from] = $.trim($(this).val());
            }
        });

        var $btn = $('#gtd-save-btn');
        var $msg = $('#gtd-save-msg');
        $btn.prop('disabled', true).text('Saving…');

        $.post(GTD.ajax_url, {
            action:     'gtd_save',
            nonce:      GTD.nonce,
            dictionary: JSON.stringify(state.dict)
        })
        .done(function (res) {
            if (res.success) {
                if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                    state.dict = res.data;
                    Object.keys(state.open).forEach(function(l) {
                        if (!state.dict[l]) delete state.open[l];
                    });
                    render();
                }
                state.dirty = false;
                $btn.text('💾 Save dictionary');
                showMsg($msg, GTD.strings.saved + ' — clear your cache!', 'ok');
            } else {
                showMsg($msg, GTD.strings.error, 'err');
            }
        })
        .fail(function () {
            showMsg($msg, GTD.strings.error, 'err');
        })
        .always(function () {
            $btn.prop('disabled', false);
            if (state.dirty) $btn.text('💾 Save dictionary *');
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function markDirty() {
        state.dirty = true;
        $('#gtd-save-btn').text('💾 Save dictionary *');
    }

    function showMsg($el, text, type) {
        $el.text(text).removeClass('ok err').addClass('show ' + type);
        setTimeout(function () { $el.removeClass('show ok err'); }, 4000);
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

})(jQuery);
