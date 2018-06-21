/**
 *
 * @name mpajax-infinite
 * @file Adds infinite scrolling to paged archives
 * @author Matt Postlethwaite
 *
 * @version 1.0.0
 *
 */


( function( $ ) {

	/* ==========================
	 * Set Constant Variables
	 * ========================== */

	// URL related const
	const directURL = window.location.href; // Directly accessed page link
	const search = window.location.search; // Get the search

	// Load button related const
	const loadButtonClassName = 'mpajax-load-button'; // Set id for load more button
	const loadButtonWrapperClassName = loadButtonClassName + '-wrapper'; // Set id for load more button
	const loadButtonClassName_Prev = loadButtonClassName + '-prev'; // Set id for load more button
	const loadButtonClassName_Next = loadButtonClassName +'-next'; // Set id for load more button

	// Placeholder button related const
	const placeholderClassName = 'mpajax-placeholder'; // Define the placeholder class
	const placeholderClassName_Prev = placeholderClassName + '-prev'; // Define the placeholder class
	const placeholderClassName_Next = placeholderClassName + '-next'; // Define the placeholder class

	// Load related const
	const loadSpinnerHtml = '<i class="fa fa-spinner fa-pulse fa-fw" style="width: 14px; height: 14px;"></i>';
	const loadErrorMessageClassName = 'mpajax-loading-error-message';

	// Number related const
	const $totalPageCount = $('.total-page-count');
	const pageNum = parseInt(mpajax.startPage); // Current page number
	const maxPageNum = $totalPageCount.length !== 0 && !isNaN($totalPageCount.html()) ? Number($totalPageCount.html()) : parseInt(mpajax.maxPages); // Use max pages or override with total page count element

	// Other const
	const $window = $(window);


	/* ==========================
	 * Set Let Variables
	 * ========================== */
	// Page related let
	let prevPageNum = pageNum - 1; // Store prev page number = current page number - 1
	let nextPageNum = pageNum + 1; // Store next page number = current page number + 1
	let prevPageURL = mpajax.prevPageURL; // The URL of the prev page of posts.
	let nextPageURL = mpajax.nextPageURL; // The URL of the next page of posts.

	// Section related let
	let lastVisibleSectionURL = '';

	// Other let
	let lastScrollTop = 0;
	let loadingCache = false;


	// =========================================
	// Functions
	// =========================================

	/**
	 *
	 * @function placeholderHTML()
	 * @description Html for the placeholder element
	 * Placeholders are used to load response data into
	 * @since 1.0.0
	 *
	 * @param {int} number - Page number for the placeholder id and data-section-name
	 * @param {string} dataURL - The URL for the data request
	 * @param {string} [classes] - Additional classes for this placeholder
	 *
	 * @returns {string} placeholder element html
	 *
	 */
	const placeholderHTML = function(number, dataURL, classes) {
		return '<div id="mpajax-content-' + number + '" class="' + placeholderClassName + ' ' + classes + '" data-section-name="mpajax-content-wrapper-page-'+ number +'" data-section-url="' + dataURL + '"></div>';
	};


	/**
	 *
	 * @function loadMoreButtonHTML()
	 * @description Html for the load more button
	 * @since 1.0.0
	 *
	 * @param {int} number - Page number for the placeholder
	 *
	 * @returns {string} Load more button
	 *
	 */
	const loadMoreButtonHTML = function(buttonText, buttonClass) {
		return '<div class="' + loadButtonWrapperClassName + ' ' + buttonClass + '-wrapper" class="clearfix"><button class="button ' + loadButtonClassName + ' ' + buttonClass + '">' + buttonText + '</button></div>';
	};


	/**
	 *
	 * @function messageHTML()
	 * @description Html for a message element
	 * @since 1.0.0
	 *
	 * @param {string} message - The text for the message element
	 * @param {string} [messageClass] - The class for the message element
	 *
	 * @returns {string} Load more button
	 *
	 */
	const messageHTML = function(message, messageClass) {
		return '<div class="mpajax-message ' + messageClass + '"><p>' + message + '</p></div>';
	}


	/**
	 *
	 * @function setupPage()
	 * @description Initialise everything needed for ajax to work
	 * @since 1.0.0
	 *
	 * @param {id/class} content - The element to add the loaded content to
	 *
	 */
	function setupPage(content) {

		const loadPrevPageMessage = prevPageNum > 1 ? 'Scroll up to load the previous pages' : 'Scroll up to load the previous page';

		// Add html class
		$('html').addClass('mpajax');

		// Was another page other than the first page loaded?
		if( pageNum != 1 ) {

			$('body').prepend('<div class="mpajax-spacer" style="height: 10px"></div>'); // Add spacer

			// Check if we are at the top of the document
			if( $window.scrollTop() == 0 ) {
				window.scrollTo(0, 10); // Scroll down to hide the empty space and so user can scroll up
			}

		}

		// Get current page content wrapper ready
		$(content + ' .cards')
			.attr('id', 'mpajax-content-' + pageNum)
			.addClass('mpajax-content-wrapper loaded')
			.attr('data-section-name', 'mpajax-content-wrapper-page-' + pageNum)
			.attr('data-section-url', directURL);

		// Add prev page loading elements if we have a prev page and we don't already have a placeholder
		if(prevPageNum !== 0 && $('.' + placeholderClassName_Prev).length === 0)
			$(content + ' .mpajax-content-wrapper.loaded:first').before(
				loadMoreButtonHTML('Load Previous', loadButtonClassName_Prev) + '\n' +
				messageHTML(loadPrevPageMessage, 'load-previous-message') + '\n' +
				placeholderHTML(prevPageNum, prevPageURL, placeholderClassName_Prev)
			);

		// Add next page loading elements if not last page and we don't already have a placeholder
		if(nextPageNum <= maxPageNum && $('.' + placeholderClassName_Next).length === 0)
			$(content).append(
				placeholderHTML(nextPageNum, nextPageURL, placeholderClassName_Next) + '\n' +
				loadMoreButtonHTML('Load More', loadButtonClassName_Next)
			);

		// Remove unnecessary elements - (pagination and results count)
		$('.module-pagination, .woocommerce-pagination, .results-count, .woocommerce-result-count').remove();

	}


	/**
	 *
	 * @function rebuildURL()
	 * @description Builds page urls
	 * @since 1.0.0
	 *
	 * @param {string} oldURL - The url to change - full url
	 * @param {string} [pageStr = false] - The new page url part - page/{n}/
	 * @param {string} [query = (const)search] - The search query string
	 *
	 * @returns {string} newURL - The new URL
	 *
	 */
	function rebuildURL(oldURL, pageStr, query) {

		let newURL = oldURL;
		pageStr = typeof(pageStr) === typeof('string') ? pageStr : false;
		query = typeof(query) === typeof('string') ? query : search;

		if( pageStr ) {
			newURL = newURL.replace(/page\/[0-9]*\//, pageStr ); // Replace old page number with the new page number
		}

		newURL = newURL.replace(/\?(.*)/, query); // Replace the search query

		return newURL;
	}

	/**
	 *
	 * @function mostylVisible()
	 * @description Checks to see which section is most visible in the viewport
	 * @since 1.0.0
	 *
	 * @param {id/class} element - The element to track
	 * @param {int} [amountVisible] - The amount of the element that should be visible - relative to the bottom of the window
	 * @param {boolean} [plus=false] - Whether to add the amountVisible rather than take it away
	 *
	 * @returns {object} sectionData - Section url and name
	 *
	 */
	function mostylVisible(element, amountVisible, plus) {

		const scrollPosition = $window.scrollTop();
		const windowHeight = $window.height();
		const sectionData = {section_name: '', section_url: ''};
		let scrolledAmount = scrollPosition + windowHeight;

		// Check if amountVisible is an int
		if(typeof(amountVisible) === typeof(1)) {

			// Check if plus is a boolean
			if(typeof(plus) !== typeof(true)) {
				plus = false; // Set to false
			}

			// Plus or Minus?
			if(plus) {
				scrolledAmount = scrolledAmount + amountVisible;
			} else {
				scrolledAmount = scrolledAmount - amountVisible;
			}
		}

		$(element).each( function() {
			const self = $(this);
			const sectionTop = self.offset().top;

			// Check if top of element is less than scrolled amount
			if( Math.round(sectionTop) < Math.round(scrolledAmount) ) {

				// Set section url from data attribute
				sectionData.section_url = self.attr('data-section-url');

				// Set section name from data attribute
				sectionData.section_name = self.attr('data-section-name');

			}
		});

		return sectionData;
	}


	/**
	 *
	 * @function updateURL()
	 * @description Updates the url when the placeholder section is more than half way into the viewport
	 * @since 1.0.0
	 *
	 */
	function updateURL() {
		// IE only supports replaceState() in v10 and above, so don't bother if those conditions aren't met.
		if ( ! window.history.replaceState ) {
			return;
		}

		var windowHeightHalf = Math.round( ($window.height() / 2) );
		var sectionEl = '.mpajax-content-wrapper';
		var visibleSectionURL = mostylVisible(sectionEl, windowHeightHalf)['section_url']; // Check which section is visible

		if( visibleSectionURL != '' && visibleSectionURL != lastVisibleSectionURL ) {

			// Update history state
			if ( window.location.href != visibleSectionURL ) {
				history.replaceState( null, null, visibleSectionURL );
			}

			lastVisibleSectionURL = visibleSectionURL;

		}
	}


	/**
	 *
	 * @function scrollLoadNextPage()
	 * @description Loads the content from the next page as the user scrolls down
	 * @since 1.0.0
	 *
	 */
	function loadNextPage() {

		const windowHeight = $window.height();
		const $lastLoadedSection = $('.mpajax-content-wrapper.loaded').last();
		const lastLoadedSectionTop = $lastLoadedSection.offset().top;

		if ( Math.round($window.scrollTop() + windowHeight) > Math.round(lastLoadedSectionTop) ) {

			// Are there more pages to load?
			if( !$('body').hasClass('loading') && nextPageNum <= maxPageNum ) {
				loadContent('#content .cards', nextPageURL, '.' + placeholderClassName_Next); // Load the next page content
			}

			if(nextPageNum > maxPageNum) {
				updateLoadButton('.' + loadButtonClassName_Next, 'No more to load', true);
				return false;
			}

		}

	}


	/**
	 *
	 * @function scrollLoadPrevPage()
	 * @description Loads the content from the previous page as the user scrolls up
	 * @since 1.0.0
	 *
	 */
	function loadPrevPage() {

		const $topLoadedSection = $('.mpajax-content-wrapper.loaded:first');
		const topLoadedSectionTop = $topLoadedSection.offset().top;

		if ( $window.scrollTop() < topLoadedSectionTop ) {

			// Are there previous pages to load?
			if( !$('body').hasClass('loading') && prevPageNum > 0 ) {
				loadContent('#content .cards', prevPageURL, '.mpajax-placeholder-prev'); // Load the next page content
			}

			$('.mpajax-spacer').remove();

		}
	}


	/**
	 *
	 * @function updateLoadButton()
	 * @description Updates the load button text and state
	 * @since 1.0.0
	 *
	 * @param {string} buttonClass - The class of the button to update
	 * @param {string} text - The text for the updated button
	 * @param {boolean} disabled - Whether the button should be disabled
	 *
	 */
	function updateLoadButton( buttonClass, text, disabled ) {
		$(buttonClass).html(text);

		if(disabled) {
			$(buttonClass).addClass('disabled');
		} else {
			$(buttonClass).removeClass('disabled');
		}
	}


	/**
	 *
	 * @function loadContent()
	 * @description Loads the content
	 * @since 1.0.0
	 *
	 * @param {id/class} content - The content load
	 * @param {string} url - The url for the load request
	 * @param {id/class} placeholder - The placeholder to add the loaded content to
	 *
	 */
	function loadContent(content, url, placeholder) {

		const loadingDirection = placeholder.replace('.' + placeholderClassName + '-' , '');
		const loadingDirectionButton = '.' + loadButtonClassName + '-' + loadingDirection;
		const loadingButtonText = loadingDirection === 'next' ? 'Load More': 'Load Previous';

		// Add .loading to body for checking if ajax already running
		$('body').addClass('loading');

		// Show that we're working.
		updateLoadButton(loadingDirectionButton, 'Loading more ' + loadSpinnerHtml, true);

		// Remove any loading errors for this direction
		$('.' + loadErrorMessageClassName + '-' + loadingDirection).remove();

		// Load the content
		$(placeholder).load( url + ' ' + content,
			function(responseText, textStatus, xhr) {

				// Handle errors
				if (xhr.readyState == 4 && textStatus == "error") {
					contentLoadError(xhr, loadingDirection);
					return false;
				}

				// Change the placeholder into a content wrapper
				$(this)
					.removeClass('mpajax-placeholder ' + placeholder.replace('.', ''))
					.addClass('mpajax-content-wrapper loaded');

				// Set up for ext ajax call depending on the loading direction
				contentLoadSuccessful(loadingDirection);

				// Return button to load more state ready for if user needs to click it
				updateLoadButton(loadingDirectionButton, loadingButtonText, false);

				// Remove the loading class
				$('body').removeClass('loading');

			}
		);

		return false;
	}


	/**
	 *
	 * @function contentLoadSuccessful()
	 * @description Runs after a successful .load() and sets up the page ready for the next load
	 * @since 1.0.0
	 *
	 * @param {string} direction - The direction of the loaded content (Should be either 'next' or 'prev')
	 *
	 */
	function contentLoadSuccessful(direction) {
		if(direction === 'next') {

			nextPageNum++; // Increase next page number

			nextPageURL = rebuildURL(nextPageURL, 'page/' + nextPageNum + '/'); // Update next page link

			// Add a new placeholder, for when function runs again.
			if(nextPageNum <= maxPageNum && $(placeholderClassName_Next).length === 0) {
				$('.' + loadButtonClassName_Next + '-wrapper').before( placeholderHTML(nextPageNum,  nextPageURL, placeholderClassName_Next) );
			}

		} else {

			const topLoadedSectionHeight = $('.mpajax-content-wrapper.loaded:first').height();
			window.scrollTo(0, $window.scrollTop() + topLoadedSectionHeight); // Adjust scroll

			prevPageNum--;
			prevPageURL = rebuildURL(prevPageURL, 'page/' + prevPageNum + '/'); // Update next page link

			// Add a new placeholder, for when function runs again.
			if(prevPageNum !== 0 && $('.' + placeholderClassName_Prev).length === 0) {
				$('.mpajax-content-wrapper.loaded:first').before( placeholderHTML(prevPageNum, prevPageURL, placeholderClassName_Prev) );
			}

			// We've loaded the first page so we don't need loading elements
			if(prevPageNum === 0) {
				$('.' + loadButtonClassName_Prev + '-wrapper, .load-previous-message' ).remove();
				return false;
			}

		}
	}


	/**
	 *
	 * @function contentLoadError()
	 * @description Runs after a successful .load() and sets up the page ready for the next load
	 * @since 1.0.0
	 *
	 * @param {string} xhr - The xhr response from the ajax call
	 * @param {string} direction - The direction of the loaded content (Should be either 'next' or 'prev')
	 *
	 */
	function contentLoadError(xhr, direction) {

		const loadingButton = '.' + loadButtonClassName + '-' + direction;
		const loadErrorMessageClassName_Direction = loadErrorMessageClassName + '-' + direction;
		xhr.status = 504
		if( xhr.status == 404 ) {
			$(loadingButton).before( messageHTML('Sorry we are unable to find the page to load', loadErrorMessageClassName + ' ' + loadErrorMessageClassName_Direction) );
			updateLoadButton(loadingButton, 'Unable to load', true);
		} else if ( xhr.status === 500 ) {
			$(loadingButton).before( messageHTML('Sorry something went wrong, please try clicking the load button', loadErrorMessageClassName + ' ' + loadErrorMessageClassName_Direction) );
			direction == 'next' ? updateLoadButton(loadingButton, 'Load more') : updateLoadButton(loadingButton, 'Load previous');
		} else {
			$(loadingButton).before( messageHTML('Sorry something went wrong, please try refreshing the page', loadErrorMessageClassName + ' ' + loadErrorMessageClassName_Direction) );
			updateLoadButton(loadingButton, 'Unable to load', true);
		}

	}


	/**
	 *
	 * @function snapbackCacheInit()
	 * @description Initialises snapback_cache.js by highrisehq - https://github.com/highrisehq/snapback_cache
	 * @since 1.0.0
	 *
	 */
	function snapbackCacheInit() {

		// Snapback settings
		const snapbackCache = SnapbackCache({
			bodySelector: "#content",
			nextPageOffset: function () {
				const pageOffset = {
					nextURL: nextPageURL,
					prevURL: prevPageURL,
					nextNum: nextPageNum,
					prevNum: prevPageNum
				}
				return pageOffset;
			}
		});


		// When snapback cache has loaded
		$("#content").on("snapback-cache:loaded", function(e, cachedPage) {

			// Updates loading vars with the cached paged offsets
			nextPageURL = cachedPage.nextPageOffset.nextURL;
			nextPageNum = cachedPage.nextPageOffset.nextNum;
			prevPageURL = cachedPage.nextPageOffset.prevURL;
			prevPageNum = cachedPage.nextPageOffset.prevNum;

			loadingCache = false; // Reset so more pages can be loaded
		});


		// Cache page on content anchor click
		$(document).on("click", "a", function () {
			snapbackCache.cachePage();
		});


		// Check to see if we have a cache for this page
		(function checkForPageCache() {

			let SSPageCache = sessionStorage.pageCache;

			if( SSPageCache ) {
				SSPageCache = JSON.parse(SSPageCache);

				// Check if to see if we don't have a pageCache for this page in the session storage before saving a new cache
				if( SSPageCache[window.location.href] ) {
					loadingCache = true;
				}
			}

		})();

	}


	/**
	 *
	 * @function mpAjaxInfinite()
	 * @description Initialises everything!
	 * @since 1.0.0
	 *
	 */
	function mpAjaxInfinite() {

		snapbackCacheInit();

		$(document).on('ready', function() {

			// Set up the page structure ready for loading content
			setupPage('#content');

			if( !loadingCache ) {

				// Load prev page when the link is clicked.
				$('.' + loadButtonClassName_Prev).click(function(e) {
					e.preventDefault();

					// Check if button is not disabled
					// Stops user making an ajax call when one is already running
					if( !$(this).hasClass('disabled') ) {
						loadContent('#content .cards', prevPageURL, '.mpajax-placeholder-prev'); // Load the prev page content
					}
				});

				// Load next page when the link is clicked.
				$('.' + loadButtonClassName_Next).click(function(e) {
					e.preventDefault();

					// Check if button is not disabled
					// Stops user making an ajax call when one is already running
					if( !$(this).hasClass('disabled') ) {
						loadContent('#content .cards', nextPageURL, '.mpajax-placeholder-next'); // Load the next page content
					}
				});

			}
		});

		// Handle scrolling
		$window.on('scroll', function() {
			if( !loadingCache ) {

				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

				updateURL(); // Update the browser url

				if(scrollTop > lastScrollTop) { // Scrolling down
					lastScrollTop = scrollTop;
					loadNextPage();
				} else { // Scrolling up
					lastScrollTop = scrollTop;
					loadPrevPage();
				}

			}
		});
	}
	mpAjaxInfinite(); // Initialise mpajax infinite scrolling

} )( jQuery );
