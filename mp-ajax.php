<?php
/**
 * Plugin Name: MP AJAX
 * Description: Handles all the site AJAX loading functionality.
 * Author: Matt Postlethwaite
 * Version: 0.1
 */


/*
 * Function mpajax_alp_init()
 * Initialization. Add our script accosiated with load-posts.php if needed on this page.
 */
function mpajax_alp_init() {
	global $wp_query;

	// echo '<pre>'; var_dump($wp_query) ;echo '</pre>';

	if( is_archive() || is_home() || is_page_template( 'page-templates/page-collections.php' ) ) {

		// Queue JS and CSS
		wp_register_script(
		'mpajax-load-posts',
		plugin_dir_url( __FILE__ ) . 'assets/js/mpajax-infinite-min.js',
		array('jquery'),
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
			'mpajax-load-posts',
			'mpajax',
			array(
				'startPage' => $paged,
				'maxPages' => $max,
				'nextPageURL' => $nextPageURL,
				'prevPageURL' => $prevPageURL,
			)
		);

		wp_enqueue_script( 'mpajax-load-posts' );

	}
}

add_action('template_redirect', 'mpajax_alp_init');
