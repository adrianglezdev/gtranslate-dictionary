/* GTranslate Custom Dictionary — Admin UI v1.0.2 */
(function ($) {
    'use strict';

    // ── Estado global ────────────────────────────────────────────────────────
    // Una sola fuente de verdad. Todo cambio modifica state.dict PRIMERO,
    // luego se re-renderiza. Nunca al revés.
    var state = {
        dict:  {},   // { langCode: { "original": "override", ... } }
        open:  {},   // { langCode: true|false }
        dirty: false
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

        // Abrir todas las tarjetas que ya tienen entradas
        Object.keys(state.dict).forEach(function(l) {
            state.open[l] = Object.keys(state.dict[l]).length > 0;
        });

        render();
        bindEvents(); // solo UNA vez
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

        // Stats
        html += '<div class="gtd-stats">'
             +    '<div class="gtd-stat"><div class="gtd-stat-num" id="gtd-count-langs">' + langs.length + '</div><div class="gtd-stat-lbl">Languages configured</div></div>'
             +    '<div class="gtd-stat"><div class="gtd-stat-num" id="gtd-count-entries">' + totalEntries + '</div><div class="gtd-stat-lbl">Total overrides</div></div>'
             +  '</div>';

        // Añadir idioma
        html += '<div class="gtd-add-lang-bar">'
             +    '<select class="gtd-select" id="gtd-lang-select">'
             +      '<option value="">— Select a language to add —</option>';
        Object.keys(GTD.langs).forEach(function(code) {
            if (!state.dict.hasOwnProperty(code)) {
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
                 +    '<p>Select a language above and start adding custom translations.</p>'
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

        // Cabecera de tarjeta
        h += '<div class="gtd-lang-header" data-lang="' + esc(lang) + '">'
           +   '<div class="gtd-lang-title">'
           +     '<span class="gtd-lang-tag">' + esc(lang) + '</span>'
           +     '<span class="gtd-lang-name">' + esc(langName) + '</span>'
           +     '<span class="gtd-entry-count" data-count="' + esc(lang) + '">' + count + ' override' + (count !== 1 ? 's' : '') + '</span>'
           +   '</div>'
           +   '<div class="gtd-lang-actions">'
           +     '<button class="gtd-btn gtd-btn-danger gtd-remove-lang" data-lang="' + esc(lang) + '">✕ Remove</button>'
           +     '<span class="gtd-chevron' + (isOpen ? ' open' : '') + '" data-chevron="' + esc(lang) + '">⌄</span>'
           +   '</div>'
           + '</div>';

        // Cuerpo de tarjeta
        h += '<div class="gtd-entries' + (isOpen ? ' open' : '') + '" data-entries="' + esc(lang) + '">';

        if (count > 0) {
            h += '<div class="gtd-entries-header"><span>Original (translated by GT)</span><span>Your override</span><span></span></div>';
            keys.forEach(function(from) {
                h += buildEntryRow(lang, from, entries[from]);
            });
        }

        // Fila para añadir nueva entrada
        h += '<div class="gtd-add-row">'
           +   '<input class="gtd-input gtd-new-from" type="text" placeholder="GT translation…" data-lang="' + esc(lang) + '" autocomplete="off" />'
           +   '<input class="gtd-input gtd-new-to"   type="text" placeholder="Your override…"  data-lang="' + esc(lang) + '" autocomplete="off" />'
           +   '<button class="gtd-add-btn gtd-add-entry" data-lang="' + esc(lang) + '" title="Add entry">+</button>'
           + '</div>';

        h += '</div>'; // .gtd-entries
        h += '</div>'; // .gtd-lang-card
        return h;
    }

    function buildEntryRow(lang, from, to) {
        return '<div class="gtd-entry-row" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '">'
             + '<input class="gtd-input gtd-edit-from" type="text" value="' + esc(from) + '" data-lang="' + esc(lang) + '" data-orig="' + esc(from) + '" />'
             + '<input class="gtd-input gtd-edit-to"   type="text" value="' + esc(to)   + '" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '" />'
             + '<button class="gtd-del-btn gtd-del-entry" data-lang="' + esc(lang) + '" data-from="' + esc(from) + '" title="Delete">✕</button>'
             + '</div>';
    }

    // ── Re-render solo la tarjeta de un idioma ────────────────────────────────
    function refreshCard(lang) {
        var $card = $('.gtd-lang-card[data-lang="' + lang + '"]');
        if ($card.length) {
            $card.replaceWith(buildCard(lang));
        }
        refreshCounters();
    }

    function refreshCounters() {
        var total = countAllEntries();
        $('#gtd-count-langs').text(Object.keys(state.dict).length);
        $('#gtd-count-entries').text(total);
        Object.keys(state.dict).forEach(function(lang) {
            var count = Object.keys(state.dict[lang]).length;
            $('[data-count="' + lang + '"]').text(count + ' override' + (count !== 1 ? 's' : ''));
        });
    }

    function countAllEntries() {
        var total = 0;
        Object.keys(state.dict).forEach(function(l) {
            total += Object.keys(state.dict[l]).length;
        });
        return total;
    }

    // ── Eventos (registrados UNA sola vez) ────────────────────────────────────
    function bindEvents() {

        // Guardar
        $(document).on('click', '#gtd-save-btn', saveDictionary);

        // Añadir idioma
        $(document).on('click', '#gtd-add-lang-btn', function () {
            var lang = $('#gtd-lang-select').val();
            if (!lang || state.dict.hasOwnProperty(lang)) return;
            state.dict[lang] = {};
            state.open[lang] = true;
            markDirty();
            render(); // render completo: cambia el <select> y añade tarjeta
        });

        // Toggle abrir/cerrar tarjeta
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
            render(); // render completo: devuelve el idioma al <select>
        });

        // Añadir entrada — botón +
        $(document).on('click', '.gtd-add-entry', function () {
            addEntry($(this).data('lang'));
        });

        // Añadir entrada — tecla Enter
        $(document).on('keydown', '.gtd-new-from, .gtd-new-to', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addEntry($(this).data('lang'));
            }
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

        // Editar "from" (renombrar clave)
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
            refreshCard(lang); // re-render para actualizar todos los data-attrs
        });

        // Editar "to" (cambiar valor)
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

        // Si la clave ya existe, actualizar valor en lugar de duplicar
        state.dict[lang][from] = to;
        state.open[lang] = true;
        markDirty();
        refreshCard(lang);
    }

    // ── Guardar en base de datos ──────────────────────────────────────────────
    function saveDictionary() {
        // Capturar valores de inputs "to" que puedan estar editados sin haber
        // disparado el evento 'change' (usuario no hizo blur antes de guardar)
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
                state.dirty = false;
                // Sync state with server response (removes empty langs)
                if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                    state.dict = res.data;
                    Object.keys(state.open).forEach(function(l) { if (!state.dict[l]) delete state.open[l]; });
                    render();
                }
                $btn.text('💾 Save dictionary');
                showMsg($msg, GTD.strings.saved, 'ok');
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
        setTimeout(function () { $el.removeClass('show ok err'); }, 3000);
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

})(jQuery);
