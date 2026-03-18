<?php
/**
 * Plugin Name:       GTranslate Dictionary
 * Plugin URI:        https://github.com/adrianglezdev/gtranslate-dictionary/releases
 * Description:       Lets you define custom word and phrase overrides for GTranslate. Instead of relying solely on automatic translations, you can build a per-language dictionary from a visual interface — no coding required. Overrides are injected automatically on the frontend.
 * Version:           1.1.0
 * Author:            Adrián González
 * Author URI:        https://github.com/adrianglezdev
 * License:           GPL v2
 * License URI:       https://es.wordpress.org/about/license/
 * Text Domain:       gtranslate-dictionary
 * Domain Path:       /languages
 * Requires at least: 6.5
 * Tested up to:      6.9.4
 * Requires PHP:      7.0
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'GTD_VERSION', '1.1.0' );
define( 'GTD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GTD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'GTD_OPTION_KEY', 'gtd_dictionary' );
define( 'GTD_SOURCE_LANG_KEY', 'gtd_source_lang' );

add_action( 'admin_menu', function () {
    add_menu_page(
        __( 'Translation Dictionary', 'gtranslate-dictionary' ),
        __( 'GT Dictionary', 'gtranslate-dictionary' ),
        'manage_options',
        'gtranslate-dictionary',
        'gtd_render_page',
        'dashicons-translation',
        80
    );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'toplevel_page_gtranslate-dictionary' ) return;

    wp_enqueue_style( 'gtd-admin', GTD_PLUGIN_URL . 'assets/admin.css', [], GTD_VERSION );
    wp_enqueue_script( 'gtd-admin', GTD_PLUGIN_URL . 'assets/admin.js', [ 'jquery' ], GTD_VERSION, true );

    $dict = gtd_get_dictionary();

    $source_lang = get_option( GTD_SOURCE_LANG_KEY, 'es' );

    wp_localize_script( 'gtd-admin', 'GTD', [
        'nonce'     => wp_create_nonce( 'gtd_save' ),
        'ajax_url'  => admin_url( 'admin-ajax.php' ),
        'langs'     => gtd_language_list(),
        'dict_json'   => wp_json_encode( $dict, JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT ),
        'source_lang' => $source_lang,
        'strings'   => [
            'saved'       => __( 'Dictionary saved!', 'gtranslate-dictionary' ),
            'error'       => __( 'Error saving. Please try again.', 'gtranslate-dictionary' ),
            'confirm_del' => __( 'Delete this entry?', 'gtranslate-dictionary' ),
        ],
    ] );
} );


add_action( 'wp_ajax_gtd_save_source_lang', function () {
    check_ajax_referer( 'gtd_save', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden', 403 );

    $lang = isset( $_POST['source_lang'] ) ? sanitize_key( $_POST['source_lang'] ) : 'es';
    if ( ! $lang ) $lang = 'es';

    update_option( GTD_SOURCE_LANG_KEY, $lang );
    // Clear the dictionary when source language changes
    update_option( GTD_OPTION_KEY, [] );
    wp_send_json_success( $lang );
} );

add_action( 'wp_ajax_gtd_save', function () {
    check_ajax_referer( 'gtd_save', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden', 403 );

    $raw  = isset( $_POST['dictionary'] ) ? stripslashes( $_POST['dictionary'] ) : '{}';
    $data = json_decode( $raw, true );

    if ( ! is_array( $data ) ) {
        wp_send_json_error( 'Invalid data' );
        return;
    }

    $clean = [];
    foreach ( $data as $lang => $entries ) {
        $lang = sanitize_key( $lang );
        if ( ! $lang ) continue;

        // Ignorar idiomas sin entradas — evita guardar [] vacíos
        if ( empty( $entries ) || ! is_array( $entries ) ) continue;

        $clean[ $lang ] = [];
        foreach ( $entries as $from => $to ) {
            $from = sanitize_text_field( (string) $from );
            $to   = sanitize_text_field( (string) $to );
            if ( $from !== '' ) {
                $clean[ $lang ][ $from ] = $to;
            }
        }

        // Si tras sanear quedó vacío, no guardar el idioma
        if ( empty( $clean[ $lang ] ) ) {
            unset( $clean[ $lang ] );
        }
    }

    update_option( GTD_OPTION_KEY, $clean );
    wp_send_json_success( $clean ); // devuelve el dict limpio para que JS lo use
} );

function gtd_get_dictionary(): array {
    $val = get_option( GTD_OPTION_KEY, [] );
    if ( ! is_array( $val ) ) return [];

    // Sanear por si acaso hay entradas [] de versiones anteriores
    $clean = [];
    foreach ( $val as $lang => $entries ) {
        if ( is_array( $entries ) && ! empty( $entries ) ) {
            $clean[ $lang ] = $entries;
        }
    }
    return $clean;
}

function gtd_language_list(): array {
    return [
        'en' => 'English',
        'fr' => 'Français',
        'de' => 'Deutsch',
        'it' => 'Italiano',
        'pt' => 'Português',
        'nl' => 'Nederlands',
        'ru' => 'Русский',
        'zh' => 'Chinese (中文)',
        'ja' => 'Japanese (日本語)',
        'ar' => 'Arabic (العربية)',
        'pl' => 'Polski',
        'es' => 'Español',
        'sv' => 'Svenska',
        'no' => 'Norsk',
        'da' => 'Dansk',
        'fi' => 'Suomi',
        'cs' => 'Čeština',
        'ro' => 'Română',
        'hu' => 'Magyar',
        'tr' => 'Türkçe',
        'ko' => 'Korean (한국어)',
    ];
}

function gtd_render_page() {
    echo '<div id="gtd-app"><div class="gtd-loading"><span class="spinner is-active"></span></div></div>';
}

add_action( 'wp_footer', function () {
    $dict = gtd_get_dictionary();
    if ( empty( $dict ) ) return;
    $json = wp_json_encode( $dict, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
    echo '<script id="gtd-overrides">';
    echo '(function(){';
    echo 'var d=' . $json . ',src=' . wp_json_encode( get_option( GTD_SOURCE_LANG_KEY, 'es' ) ) . ';';
    echo 'function lang(){var u=new URLSearchParams(window.location.search),l=u.get("lang")||u.get("hl");if(l)return l;var m=document.cookie.match(/googtrans=\/[a-z-]+\/([a-z-]+)/);if(m)return m[1];var h=document.documentElement.lang;if(h&&h!==src)return h.split("-")[0];return null;}';
    echo 'function apply(root,dict){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}},false),node;while((node=w.nextNode())){var v=node.nodeValue,c=false;for(var f in dict){if(v.indexOf(f)!==-1){v=v.split(f).join(dict[f]);c=true;}}if(c)node.nodeValue=v;}}';
    echo 'function run(){var l=lang();if(!l||!d[l])return;apply(document.body,d[l]);}';
    echo 'document.readyState==="loading"?document.addEventListener("DOMContentLoaded",run):run();';
    echo 'var obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(run,250);});';
    echo 'document.addEventListener("DOMContentLoaded",function(){obs.observe(document.body,{childList:true,subtree:true,characterData:true});});';
    echo 'setTimeout(run,1000);setTimeout(run,3000);';
    echo '})();';
    echo '</script>';
} );
