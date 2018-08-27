<?php
/**
 * Plugin Name: MP AJAX
 * Description: Handles all the site AJAX loading functionality.
 * Author: Matt Postlethwaite
 * Version: 0.1
 */


// ==========================================================
// Function mptheme_user_logged_in_body_class()
//
// Adds logged in/out class to the body_class
// ==========================================================
function mpajax_add_body_class( $classes ) {

	if( is_archive() || is_home() || is_page_template( 'page-templates/page-collections.php' ) )
		$classes[] = 'mpajax-init';

	return $classes;
}
add_filter( 'body_class', 'mpajax_add_body_class', 99 );

/*
 * Function mpajax_init()
 * Initialization. Add our script accosiated with load-posts.php if needed on this page.
 */
function mpajax_init() {
	global $wp_query;

	// if( is_archive() || is_home() || is_page_template( 'page-templates/page-collections.php' ) ) {

		// Enqueue SnapBackCache script
		wp_enqueue_script(
			'mpajax-snapbackcache',
			plugin_dir_url( __FILE__ ) . 'assets/js/snapback_cache.js',
			array('jquery'),
			'1.0',
			true
		);

		// Register main mpajax script
		wp_register_script(
			'mpajax-infinite',
			plugin_dir_url( __FILE__ ) . 'assets/js/mpajax-infinite-min.js',
			array('jquery', 'mpajax-snapbackcache'),
			'1.0',
			true
		);


		// What page are we on? And what is the pages limit?
		$max = $wp_query->max_num_pages;
		$paged = ( get_query_var('paged') > 1 ) ? get_query_var('paged') : 1;
		$nextPageURL = next_posts( $max, false );
		$prevPageURL = previous_posts( false );

		// Add some parameters for the JS.
		wp_localize_script(
			'mpajax-infinite',
			'mpajax',
			array(
				'startPage' => $paged,
				'maxPages' => $max,
				'nextPageURL' => $nextPageURL,
				'prevPageURL' => $prevPageURL,
			)
		);

		wp_enqueue_script( 'mpajax-infinite' );

	// }
}

add_action('template_redirect', 'mpajax_init');
