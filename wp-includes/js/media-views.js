/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 7145
(module) {

var Selection = wp.media.model.Selection,
	Library = wp.media.controller.Library,
	CollectionAdd;

/**
 * wp.media.controller.CollectionAdd
 *
 * A state for adding attachments to a collection (e.g. video playlist).
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=library]              Unique identifier.
 * @param {string}                     attributes.title                     Title for the state. Displays in the frame's title region.
 * @param {boolean|string}             [attributes.multiple=add]            Whether multi-select is enabled. Accepts 'add' or true.
 *                                                                          When set to true, requires Shift or Cmd/Ctrl to select multiple items.
 *                                                                          When set to 'add', allows selecting multiple items by clicking thumbnails.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of attachments of the specified type will be created.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {string}                     [attributes.menu=gallery]            Initial mode for the menu region.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=gallery-add]     Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {int}                        [attributes.priority=100]            The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]     Whether the Attachments selection should be persisted from the last state.
 *                                                                          Defaults to false because for this state, because the library of the Edit Gallery state is the selection.
 * @param {string}                     attributes.type                      The collection's media type. (e.g. 'video').
 * @param {string}                     attributes.collectionType            The collection type. (e.g. 'playlist').
 */
CollectionAdd = Library.extend(/** @lends wp.media.controller.CollectionAdd.prototype */{
	defaults: _.defaults( {
		// Selection defaults. @see media.model.Selection
		multiple:      'add',
		// Attachments browser defaults. @see media.view.AttachmentsBrowser
		filterable:    'uploaded',

		priority:      100,
		syncSelection: false
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 */
	initialize: function() {
		var collectionType = this.get('collectionType');

		if ( 'video' === this.get( 'type' ) ) {
			collectionType = 'video-' + collectionType;
		}

		this.set( 'id', collectionType + '-library' );
		this.set( 'toolbar', collectionType + '-add' );
		this.set( 'menu', collectionType );

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: this.get('type') }) );
		}
		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		var library = this.get('library'),
			editLibrary = this.get('editLibrary'),
			edit = this.frame.state( this.get('collectionType') + '-edit' ).get('library');

		if ( editLibrary && editLibrary !== edit ) {
			library.unobserve( editLibrary );
		}

		// Accepts attachments that exist in the original library and
		// that do not exist in gallery's library.
		library.validator = function( attachment ) {
			return !! this.mirroring.get( attachment.cid ) && ! edit.get( attachment.cid ) && Selection.prototype.validator.apply( this, arguments );
		};

		/*
		 * Reset the library to ensure that all attachments are re-added
		 * to the collection. Do so silently, as calling `observe` will
		 * trigger the `reset` event.
		 */
		library.reset( library.mirroring.models, { silent: true });
		library.observe( edit );
		this.set('editLibrary', edit);

		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = CollectionAdd;


/***/ },

/***/ 8612
(module) {

var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	CollectionEdit;

/**
 * wp.media.controller.CollectionEdit
 *
 * A state for editing a collection, which is used by audio and video playlists,
 * and can be used for other collections.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                      The attributes hash passed to the state.
 * @param {string}                     attributes.title                  Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]              The attachments collection to edit.
 *                                                                       If one is not supplied, an empty media.model.Selection collection is created.
 * @param {boolean}                    [attributes.multiple=false]       Whether multi-select is enabled.
 * @param {string}                     [attributes.content=browse]       Initial mode for the content region.
 * @param {string}                     attributes.menu                   Initial mode for the menu region. @todo this needs a better explanation.
 * @param {boolean}                    [attributes.searchable=false]     Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]        Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.date=true]            Whether to show the date filter in the browser's toolbar.
 * @param {boolean}                    [attributes.describe=true]        Whether to offer UI to describe the attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.dragInfo=true]        Whether to show instructional text about the attachments being sortable.
 * @param {boolean}                    [attributes.dragInfoText]         Instructional text about the attachments being sortable.
 * @param {int}                        [attributes.idealColumnWidth=170] The ideal column width in pixels for attachments.
 * @param {boolean}                    [attributes.editing=false]        Whether the gallery is being created, or editing an existing instance.
 * @param {int}                        [attributes.priority=60]          The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]  Whether the Attachments selection should be persisted from the last state.
 *                                                                       Defaults to false for this state, because the library passed in  *is* the selection.
 * @param {view}                       [attributes.SettingsView]         The view to edit the collection instance settings (e.g. Playlist settings with "Show tracklist" checkbox).
 * @param {view}                       [attributes.AttachmentView]       The single `Attachment` view to be used in the `Attachments`.
 *                                                                       If none supplied, defaults to wp.media.view.Attachment.EditLibrary.
 * @param {string}                     attributes.type                   The collection's media type. (e.g. 'video').
 * @param {string}                     attributes.collectionType         The collection type. (e.g. 'playlist').
 */
CollectionEdit = Library.extend(/** @lends wp.media.controller.CollectionEdit.prototype */{
	defaults: {
		multiple:         false,
		sortable:         true,
		date:             false,
		searchable:       false,
		content:          'browse',
		describe:         true,
		dragInfo:         true,
		idealColumnWidth: 170,
		editing:          false,
		priority:         60,
		SettingsView:     false,
		syncSelection:    false
	},

	/**
	 * @since 3.9.0
	 */
	initialize: function() {
		var collectionType = this.get('collectionType');

		if ( 'video' === this.get( 'type' ) ) {
			collectionType = 'video-' + collectionType;
		}

		this.set( 'id', collectionType + '-edit' );
		this.set( 'toolbar', collectionType + '-edit' );

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', new wp.media.model.Selection() );
		}
		// The single `Attachment` view to be used in the `Attachments` view.
		if ( ! this.get('AttachmentView') ) {
			this.set( 'AttachmentView', wp.media.view.Attachment.EditLibrary );
		}
		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		var library = this.get('library');

		// Limit the library to images only.
		library.props.set( 'type', this.get( 'type' ) );

		// Watch for uploaded attachments.
		this.get('library').observe( wp.Uploader.queue );

		this.frame.on( 'content:render:browse', this.renderSettings, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	deactivate: function() {
		// Stop watching for uploaded attachments.
		this.get('library').unobserve( wp.Uploader.queue );

		this.frame.off( 'content:render:browse', this.renderSettings, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * Render the collection embed settings view in the browser sidebar.
	 *
	 * @todo This is against the pattern elsewhere in media. Typically the frame
	 *       is responsible for adding region mode callbacks. Explain.
	 *
	 * @since 3.9.0
	 *
	 * @param {wp.media.view.attachmentsBrowser} The attachments browser view.
	 */
	renderSettings: function( attachmentsBrowserView ) {
		var library = this.get('library'),
			collectionType = this.get('collectionType'),
			dragInfoText = this.get('dragInfoText'),
			SettingsView = this.get('SettingsView'),
			obj = {};

		if ( ! library || ! attachmentsBrowserView ) {
			return;
		}

		library[ collectionType ] = library[ collectionType ] || new Backbone.Model();

		obj[ collectionType ] = new SettingsView({
			controller: this,
			model:      library[ collectionType ],
			priority:   40
		});

		attachmentsBrowserView.sidebar.set( obj );

		if ( dragInfoText ) {
			attachmentsBrowserView.toolbar.set( 'dragInfo', new wp.media.View({
				el: $( '<div class="instructions">' + dragInfoText + '</div>' )[0],
				priority: -40
			}) );
		}

		// Add the 'Reverse order' button to the toolbar.
		attachmentsBrowserView.toolbar.set( 'reverse', {
			text:     l10n.reverseOrder,
			priority: 80,

			click: function() {
				library.reset( library.toArray().reverse() );
			}
		});
	}
});

module.exports = CollectionEdit;


/***/ },

/***/ 5422
(module) {

var l10n = wp.media.view.l10n,
	Cropper;

/**
 * wp.media.controller.Cropper
 *
 * A class for cropping an image when called from the header media customization panel.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
Cropper = wp.media.controller.State.extend(/** @lends wp.media.controller.Cropper.prototype */{
	defaults: {
		id:          'cropper',
		title:       l10n.cropImage,
		// Region mode defaults.
		toolbar:     'crop',
		content:     'crop',
		router:      false,
		canSkipCrop: false,

		// Default doCrop Ajax arguments to allow the Customizer (for example) to inject state.
		doCropArgs: {}
	},

	/**
	 * Shows the crop image window when called from the Add new image button.
	 *
	 * @since 4.2.0
	 *
	 * @return {void}
	 */
	activate: function() {
		this.frame.on( 'content:create:crop', this.createCropContent, this );
		this.frame.on( 'close', this.removeCropper, this );
		this.set('selection', new Backbone.Collection(this.frame._selection.single));
	},

	/**
	 * Changes the state of the toolbar window to browse mode.
	 *
	 * @since 4.2.0
	 *
	 * @return {void}
	 */
	deactivate: function() {
		this.frame.toolbar.mode('browse');
	},

	/**
	 * Creates the crop image window.
	 *
	 * Initialized when clicking on the Select and Crop button.
	 *
	 * @since 4.2.0
	 *
	 * @fires crop window
	 *
	 * @return {void}
	 */
	createCropContent: function() {
		this.cropperView = new wp.media.view.Cropper({
			controller: this,
			attachment: this.get('selection').first()
		});
		this.cropperView.on('image-loaded', this.createCropToolbar, this);
		this.frame.content.set(this.cropperView);

	},

	/**
	 * Removes the image selection and closes the cropping window.
	 *
	 * @since 4.2.0
	 *
	 * @return {void}
	 */
	removeCropper: function() {
		this.imgSelect.cancelSelection();
		this.imgSelect.setOptions({remove: true});
		this.imgSelect.update();
		this.cropperView.remove();
	},

	/**
	 * Checks if cropping can be skipped and creates crop toolbar accordingly.
	 *
	 * @since 4.2.0
	 *
	 * @return {void}
	 */
	createCropToolbar: function() {
		var canSkipCrop, hasRequiredAspectRatio, suggestedCropSize, toolbarOptions;

		suggestedCropSize      = this.get( 'suggestedCropSize' );
		hasRequiredAspectRatio = this.get( 'hasRequiredAspectRatio' );
		canSkipCrop            = this.get( 'canSkipCrop' ) || false;

		toolbarOptions = {
			controller: this.frame,
			items: {
				insert: {
					style:    'primary',
					text:     l10n.cropImage,
					priority: 80,
					requires: { library: false, selection: false },

					click: function() {
						var controller = this.controller,
							selection;

						selection = controller.state().get('selection').first();
						selection.set({cropDetails: controller.state().imgSelect.getSelection()});

						this.$el.text(l10n.cropping);
						this.$el.prop( 'disabled', true );

						controller.state().doCrop( selection ).done( function( croppedImage ) {
							controller.trigger('cropped', croppedImage );
							controller.close();
						}).fail( function() {
							controller.trigger('content:error:crop');
						});
					}
				}
			}
		};

		if ( canSkipCrop || hasRequiredAspectRatio ) {
			_.extend( toolbarOptions.items, {
				skip: {
					style:      'secondary',
					text:       l10n.skipCropping,
					priority:   70,
					requires:   { library: false, selection: false },
					click:      function() {
						var controller = this.controller,
							selection = controller.state().get( 'selection' ).first();

						controller.state().cropperView.remove();

						// Apply the suggested crop size.
						if ( hasRequiredAspectRatio && !canSkipCrop ) {
							selection.set({cropDetails: suggestedCropSize});
							controller.state().doCrop( selection ).done( function( croppedImage ) {
								controller.trigger( 'cropped', croppedImage );
								controller.close();
							}).fail( function() {
								controller.trigger( 'content:error:crop' );
							});
							return;
						}

						// Skip the cropping process.
						controller.trigger( 'skippedcrop', selection );
						controller.close();
					}
				}
			});
		}

		this.frame.toolbar.set( new wp.media.view.Toolbar(toolbarOptions) );
	},

	/**
	 * Creates an object with the image attachment and crop properties.
	 *
	 * @since 4.2.0
	 *
	 * @return {$.promise} A jQuery promise with the custom header crop details.
	 */
	doCrop: function( attachment ) {
		return wp.ajax.post( 'custom-header-crop', _.extend(
			{},
			this.defaults.doCropArgs,
			{
				nonce: attachment.get( 'nonces' ).edit,
				id: attachment.get( 'id' ),
				cropDetails: attachment.get( 'cropDetails' )
			}
		) );
	}
});

module.exports = Cropper;


/***/ },

/***/ 9660
(module) {

var Controller = wp.media.controller,
	CustomizeImageCropper;

/**
 * A state for cropping an image in the customizer.
 *
 * @since 4.3.0
 *
 * @constructs wp.media.controller.CustomizeImageCropper
 * @memberOf wp.media.controller
 * @augments wp.media.controller.CustomizeImageCropper.Cropper
 * @inheritDoc
 */
CustomizeImageCropper = Controller.Cropper.extend(/** @lends wp.media.controller.CustomizeImageCropper.prototype */{
	/**
	 * Posts the crop details to the admin.
	 *
	 * Uses crop measurements when flexible in both directions.
	 * Constrains flexible side based on image ratio and size of the fixed side.
	 *
	 * @since 4.3.0
	 *
	 * @param {Object} attachment The attachment to crop.
	 *
	 * @return {$.promise} A jQuery promise that represents the crop image request.
	 */
	doCrop: function( attachment ) {
		var cropDetails = attachment.get( 'cropDetails' ),
			control = this.get( 'control' ),
			ratio = cropDetails.width / cropDetails.height;

		// Use crop measurements when flexible in both directions.
		if ( control.params.flex_width && control.params.flex_height ) {
			cropDetails.dst_width  = cropDetails.width;
			cropDetails.dst_height = cropDetails.height;

		// Constrain flexible side based on image ratio and size of the fixed side.
		} else {
			cropDetails.dst_width  = control.params.flex_width  ? control.params.height * ratio : control.params.width;
			cropDetails.dst_height = control.params.flex_height ? control.params.width  / ratio : control.params.height;
		}

		return wp.ajax.post( 'crop-image', {
			wp_customize: 'on',
			nonce: attachment.get( 'nonces' ).edit,
			id: attachment.get( 'id' ),
			context: control.id,
			cropDetails: cropDetails
		} );
	}
});

module.exports = CustomizeImageCropper;


/***/ },

/***/ 5663
(module) {

var l10n = wp.media.view.l10n,
	EditImage;

/**
 * wp.media.controller.EditImage
 *
 * A state for editing (cropping, etc.) an image.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                    attributes                      The attributes hash passed to the state.
 * @param {wp.media.model.Attachment} attributes.model                The attachment.
 * @param {string}                    [attributes.id=edit-image]      Unique identifier.
 * @param {string}                    [attributes.title=Edit Image]   Title for the state. Displays in the media menu and the frame's title region.
 * @param {string}                    [attributes.content=edit-image] Initial mode for the content region.
 * @param {string}                    [attributes.toolbar=edit-image] Initial mode for the toolbar region.
 * @param {string}                    [attributes.menu=false]         Initial mode for the menu region.
 * @param {string}                    [attributes.url]                Unused. @todo Consider removal.
 */
EditImage = wp.media.controller.State.extend(/** @lends wp.media.controller.EditImage.prototype */{
	defaults: {
		id:      'edit-image',
		title:   l10n.editImage,
		menu:    false,
		toolbar: 'edit-image',
		content: 'edit-image',
		url:     ''
	},

	/**
	 * Activates a frame for editing a featured image.
	 *
	 * @since 3.9.0
	 *
	 * @return {void}
	 */
	activate: function() {
		this.frame.on( 'toolbar:render:edit-image', _.bind( this.toolbar, this ) );
	},

	/**
	 * Deactivates a frame for editing a featured image.
	 *
	 * @since 3.9.0
	 *
	 * @return {void}
	 */
	deactivate: function() {
		this.frame.off( 'toolbar:render:edit-image' );
	},

	/**
	 * Adds a toolbar with a back button.
	 *
	 * When the back button is pressed it checks whether there is a previous state.
	 * In case there is a previous state it sets that previous state otherwise it
	 * closes the frame.
	 *
	 * @since 3.9.0
	 *
	 * @return {void}
	 */
	toolbar: function() {
		var frame = this.frame,
			lastState = frame.lastState(),
			previous = lastState && lastState.id;

		frame.toolbar.set( new wp.media.view.Toolbar({
			controller: frame,
			items: {
				back: {
					style: 'primary',
					text:     l10n.back,
					priority: 20,
					click:    function() {
						if ( previous ) {
							frame.setState( previous );
						} else {
							frame.close();
						}
					}
				}
			}
		}) );
	}
});

module.exports = EditImage;


/***/ },

/***/ 4910
(module) {

var l10n = wp.media.view.l10n,
	$ = Backbone.$,
	Embed;

/**
 * wp.media.controller.Embed
 *
 * A state for embedding media from a URL.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object} attributes                         The attributes hash passed to the state.
 * @param {string} [attributes.id=embed]              Unique identifier.
 * @param {string} [attributes.title=Insert From URL] Title for the state. Displays in the media menu and the frame's title region.
 * @param {string} [attributes.content=embed]         Initial mode for the content region.
 * @param {string} [attributes.menu=default]          Initial mode for the menu region.
 * @param {string} [attributes.toolbar=main-embed]    Initial mode for the toolbar region.
 * @param {string} [attributes.menu=false]            Initial mode for the menu region.
 * @param {int}    [attributes.priority=120]          The priority for the state link in the media menu.
 * @param {string} [attributes.type=link]             The type of embed. Currently only link is supported.
 * @param {string} [attributes.url]                   The embed URL.
 * @param {object} [attributes.metadata={}]           Properties of the embed, which will override attributes.url if set.
 */
Embed = wp.media.controller.State.extend(/** @lends wp.media.controller.Embed.prototype */{
	defaults: {
		id:       'embed',
		title:    l10n.insertFromUrlTitle,
		content:  'embed',
		menu:     'default',
		toolbar:  'main-embed',
		priority: 120,
		type:     'link',
		url:      '',
		metadata: {}
	},

	// The amount of time used when debouncing the scan.
	sensitivity: 400,

	initialize: function(options) {
		this.metadata = options.metadata;
		this.debouncedScan = _.debounce( _.bind( this.scan, this ), this.sensitivity );
		this.props = new Backbone.Model( this.metadata || { url: '' });
		this.props.on( 'change:url', this.debouncedScan, this );
		this.props.on( 'change:url', this.refresh, this );
		this.on( 'scan', this.scanImage, this );
	},

	/**
	 * Trigger a scan of the embedded URL's content for metadata required to embed.
	 *
	 * @fires wp.media.controller.Embed#scan
	 */
	scan: function() {
		var scanners,
			embed = this,
			attributes = {
				type: 'link',
				scanners: []
			};

		/*
		 * Scan is triggered with the list of `attributes` to set on the
		 * state, useful for the 'type' attribute and 'scanners' attribute,
		 * an array of promise objects for asynchronous scan operations.
		 */
		if ( this.props.get('url') ) {
			this.trigger( 'scan', attributes );
		}

		if ( attributes.scanners.length ) {
			scanners = attributes.scanners = $.when.apply( $, attributes.scanners );
			scanners.always( function() {
				if ( embed.get('scanners') === scanners ) {
					embed.set( 'loading', false );
				}
			});
		} else {
			attributes.scanners = null;
		}

		attributes.loading = !! attributes.scanners;
		this.set( attributes );
	},
	/**
	 * Try scanning the embed as an image to discover its dimensions.
	 *
	 * @param {Object} attributes
	 */
	scanImage: function( attributes ) {
		var frame = this.frame,
			state = this,
			url = this.props.get('url'),
			image = new Image(),
			deferred = $.Deferred();

		attributes.scanners.push( deferred.promise() );

		// Try to load the image and find its width/height.
		image.onload = function() {
			deferred.resolve();

			if ( state !== frame.state() || url !== state.props.get('url') ) {
				return;
			}

			state.set({
				type: 'image'
			});

			state.props.set({
				width:  image.width,
				height: image.height
			});
		};

		image.onerror = deferred.reject;
		image.src = url;
	},

	refresh: function() {
		this.frame.toolbar.get().refresh();
	},

	reset: function() {
		this.props.clear().set({ url: '' });

		if ( this.active ) {
			this.refresh();
		}
	}
});

module.exports = Embed;


/***/ },

/***/ 1169
(module) {

var Attachment = wp.media.model.Attachment,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	FeaturedImage;

/**
 * wp.media.controller.FeaturedImage
 *
 * A state for selecting a featured image for a post.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                          The attributes hash passed to the state.
 * @param {string}                     [attributes.id=featured-image]        Unique identifier.
 * @param {string}                     [attributes.title=Set Featured Image] Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]                  The attachments collection to browse.
 *                                                                           If one is not supplied, a collection of all images will be created.
 * @param {boolean}                    [attributes.multiple=false]           Whether multi-select is enabled.
 * @param {string}                     [attributes.content=upload]           Initial mode for the content region.
 *                                                                           Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.menu=default]             Initial mode for the menu region.
 * @param {string}                     [attributes.router=browse]            Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=featured-image]   Initial mode for the toolbar region.
 * @param {int}                        [attributes.priority=60]              The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.searchable=true]          Whether the library is searchable.
 * @param {boolean|string}             [attributes.filterable=false]         Whether the library is filterable, and if so what filters should be shown.
 *                                                                           Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                    [attributes.sortable=true]            Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]          Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.describe=false]           Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.contentUserSetting=true]  Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                    [attributes.syncSelection=true]       Whether the Attachments selection should be persisted from the last state.
 */
FeaturedImage = Library.extend(/** @lends wp.media.controller.FeaturedImage.prototype */{
	defaults: _.defaults({
		id:            'featured-image',
		title:         l10n.setFeaturedImageTitle,
		multiple:      false,
		filterable:    'uploaded',
		toolbar:       'featured-image',
		priority:      60,
		syncSelection: true
	}, Library.prototype.defaults ),

	/**
	 * @since 3.5.0
	 */
	initialize: function() {
		var library, comparator;

		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );

		library    = this.get('library');
		comparator = library.comparator;

		// Overload the library's comparator to push items that are not in
		// the mirrored query to the front of the aggregate collection.
		library.comparator = function( a, b ) {
			var aInQuery = !! this.mirroring.get( a.cid ),
				bInQuery = !! this.mirroring.get( b.cid );

			if ( ! aInQuery && bInQuery ) {
				return -1;
			} else if ( aInQuery && ! bInQuery ) {
				return 1;
			} else {
				return comparator.apply( this, arguments );
			}
		};

		// Add all items in the selection to the library, so any featured
		// images that are not initially loaded still appear.
		library.observe( this.get('selection') );
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		this.frame.on( 'open', this.updateSelection, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	deactivate: function() {
		this.frame.off( 'open', this.updateSelection, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * @since 3.5.0
	 */
	updateSelection: function() {
		var selection = this.get('selection'),
			id = wp.media.view.settings.post.featuredImageId,
			attachment;

		if ( '' !== id && -1 !== id ) {
			attachment = Attachment.get( id );
			attachment.fetch();
		}

		selection.reset( attachment ? [ attachment ] : [] );
	}
});

module.exports = FeaturedImage;


/***/ },

/***/ 7127
(module) {

var Selection = wp.media.model.Selection,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	GalleryAdd;

/**
 * wp.media.controller.GalleryAdd
 *
 * A state for selecting more images to add to a gallery.
 *
 * @since 3.5.0
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @memberof wp.media.controller
 *
 * @param {Object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=gallery-library]      Unique identifier.
 * @param {string}                     [attributes.title=Add to Gallery]    Title for the state. Displays in the frame's title region.
 * @param {boolean|string}             [attributes.multiple=add]            Whether multi-select is enabled. Accepts 'add' or true.
 *                                                                          When set to true, requires Shift or Cmd/Ctrl to select multiple items.
 *                                                                          When set to 'add', allows selecting multiple items by clicking thumbnails.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of all images will be created.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {string}                     [attributes.menu=gallery]            Initial mode for the menu region.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=gallery-add]     Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {number}                     [attributes.priority=100]            The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]     Whether the Attachments selection should be persisted from the last state.
 *                                                                          Defaults to false because for this state, because the library of the Edit Gallery state is the selection.
 */
GalleryAdd = Library.extend(/** @lends wp.media.controller.GalleryAdd.prototype */{
	defaults: _.defaults({
		id:            'gallery-library',
		title:         l10n.addToGalleryTitle,
		multiple:      'add',
		filterable:    'uploaded',
		menu:          'gallery',
		toolbar:       'gallery-add',
		priority:      100,
		syncSelection: false
	}, Library.prototype.defaults ),

	/**
	 * Initializes the library. Creates a library of images if a library isn't supplied.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	initialize: function() {
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * Activates the library.
	 *
	 * Removes all event listeners if in edit mode. Creates a validator to check an attachment.
	 * Resets library and re-enables event listeners. Activates edit mode. Calls the parent's activate method.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	activate: function() {
		var library = this.get('library'),
			edit    = this.frame.state('gallery-edit').get('library');

		if ( this.editLibrary && this.editLibrary !== edit ) {
			library.unobserve( this.editLibrary );
		}

		/*
		 * Accept attachments that exist in the original library but
		 * that do not exist in gallery's library yet.
		 */
		library.validator = function( attachment ) {
			return !! this.mirroring.get( attachment.cid ) && ! edit.get( attachment.cid ) && Selection.prototype.validator.apply( this, arguments );
		};

		/*
		 * Reset the library to ensure that all attachments are re-added
		 * to the collection. Do so silently, as calling `observe` will
		 * trigger the `reset` event.
		 */
		library.reset( library.mirroring.models, { silent: true });
		library.observe( edit );
		this.editLibrary = edit;

		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = GalleryAdd;


/***/ },

/***/ 2038
(module) {

var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	GalleryEdit;

/**
 * wp.media.controller.GalleryEdit
 *
 * A state for editing a gallery's images and settings.
 *
 * @since 3.5.0
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @memberOf wp.media.controller
 *
 * @param {Object}                     [attributes]                       The attributes hash passed to the state.
 * @param {string}                     [attributes.id=gallery-edit]       Unique identifier.
 * @param {string}                     [attributes.title=Edit Gallery]    Title for the state. Displays in the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]               The collection of attachments in the gallery.
 *                                                                        If one is not supplied, an empty media.model.Selection collection is created.
 * @param {boolean}                    [attributes.multiple=false]        Whether multi-select is enabled.
 * @param {boolean}                    [attributes.searchable=false]      Whether the library is searchable.
 * @param {boolean}                    [attributes.sortable=true]         Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.date=true]             Whether to show the date filter in the browser's toolbar.
 * @param {string|false}               [attributes.content=browse]        Initial mode for the content region.
 * @param {string|false}               [attributes.toolbar=image-details] Initial mode for the toolbar region.
 * @param {boolean}                    [attributes.describe=true]         Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.displaySettings=true]  Whether to show the attachment display settings interface.
 * @param {boolean}                    [attributes.dragInfo=true]         Whether to show instructional text about the attachments being sortable.
 * @param {number}                     [attributes.idealColumnWidth=170]  The ideal column width in pixels for attachments.
 * @param {boolean}                    [attributes.editing=false]         Whether the gallery is being created, or editing an existing instance.
 * @param {number}                     [attributes.priority=60]           The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.syncSelection=false]   Whether the Attachments selection should be persisted from the last state.
 *                                                                        Defaults to false for this state, because the library passed in  *is* the selection.
 * @param {view}                       [attributes.AttachmentView]        The single `Attachment` view to be used in the `Attachments`.
 *                                                                        If none supplied, defaults to wp.media.view.Attachment.EditLibrary.
 */
GalleryEdit = Library.extend(/** @lends wp.media.controller.GalleryEdit.prototype */{
	defaults: {
		id:               'gallery-edit',
		title:            l10n.editGalleryTitle,
		multiple:         false,
		searchable:       false,
		sortable:         true,
		date:             false,
		display:          false,
		content:          'browse',
		toolbar:          'gallery-edit',
		describe:         true,
		displaySettings:  true,
		dragInfo:         true,
		idealColumnWidth: 170,
		editing:          false,
		priority:         60,
		syncSelection:    false
	},

	/**
	 * Initializes the library.
	 *
	 * Creates a selection if a library isn't supplied and creates an attachment
	 * view if no attachment view is supplied.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	initialize: function() {
		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', new wp.media.model.Selection() );
		}

		// The single `Attachment` view to be used in the `Attachments` view.
		if ( ! this.get('AttachmentView') ) {
			this.set( 'AttachmentView', wp.media.view.Attachment.EditLibrary );
		}

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * Activates the library.
	 *
	 * Limits the library to images, watches for uploaded attachments. Watches for
	 * the browse event on the frame and binds it to gallerySettings.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	activate: function() {
		var library = this.get('library');

		// Limit the library to images only.
		library.props.set( 'type', 'image' );

		// Watch for uploaded attachments.
		this.get('library').observe( wp.Uploader.queue );

		this.frame.on( 'content:render:browse', this.gallerySettings, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * Deactivates the library.
	 *
	 * Stops watching for uploaded attachments and browse events.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	deactivate: function() {
		// Stop watching for uploaded attachments.
		this.get('library').unobserve( wp.Uploader.queue );

		this.frame.off( 'content:render:browse', this.gallerySettings, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * Adds the gallery settings to the sidebar and adds a reverse button to the
	 * toolbar.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.view.Frame} browser The file browser.
	 *
	 * @return {void}
	 */
	gallerySettings: function( browser ) {
		if ( ! this.get('displaySettings') ) {
			return;
		}

		var library = this.get('library');

		if ( ! library || ! browser ) {
			return;
		}

		library.gallery = library.gallery || new Backbone.Model();

		browser.sidebar.set({
			gallery: new wp.media.view.Settings.Gallery({
				controller: this,
				model:      library.gallery,
				priority:   40
			})
		});

		browser.toolbar.set( 'reverse', {
			text:     l10n.reverseOrder,
			priority: 80,

			click: function() {
				library.reset( library.toArray().reverse() );
			}
		});
	}
});

module.exports = GalleryEdit;


/***/ },

/***/ 705
(module) {

var State = wp.media.controller.State,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	ImageDetails;

/**
 * wp.media.controller.ImageDetails
 *
 * A state for editing the attachment display settings of an image that's been
 * inserted into the editor.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                    [attributes]                       The attributes hash passed to the state.
 * @param {string}                    [attributes.id=image-details]      Unique identifier.
 * @param {string}                    [attributes.title=Image Details]   Title for the state. Displays in the frame's title region.
 * @param {wp.media.model.Attachment} attributes.image                   The image's model.
 * @param {string|false}              [attributes.content=image-details] Initial mode for the content region.
 * @param {string|false}              [attributes.menu=false]            Initial mode for the menu region.
 * @param {string|false}              [attributes.router=false]          Initial mode for the router region.
 * @param {string|false}              [attributes.toolbar=image-details] Initial mode for the toolbar region.
 * @param {boolean}                   [attributes.editing=false]         Unused.
 * @param {int}                       [attributes.priority=60]           Unused.
 *
 * @todo This state inherits some defaults from media.controller.Library.prototype.defaults,
 *       however this may not do anything.
 */
ImageDetails = State.extend(/** @lends wp.media.controller.ImageDetails.prototype */{
	defaults: _.defaults({
		id:       'image-details',
		title:    l10n.imageDetailsTitle,
		content:  'image-details',
		menu:     false,
		router:   false,
		toolbar:  'image-details',
		editing:  false,
		priority: 60
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options Attributes
	 */
	initialize: function( options ) {
		this.image = options.image;
		State.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		this.frame.modal.$el.addClass('image-details');
	}
});

module.exports = ImageDetails;


/***/ },

/***/ 472
(module) {

var l10n = wp.media.view.l10n,
	getUserSetting = window.getUserSetting,
	setUserSetting = window.setUserSetting,
	Library;

/**
 * wp.media.controller.Library
 *
 * A state for choosing an attachment or group of attachments from the media library.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 * @mixes media.selectionSync
 *
 * @param {object}                          [attributes]                         The attributes hash passed to the state.
 * @param {string}                          [attributes.id=library]              Unique identifier.
 * @param {string}                          [attributes.title=Media library]     Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments}      [attributes.library]                 The attachments collection to browse.
 *                                                                               If one is not supplied, a collection of all attachments will be created.
 * @param {wp.media.model.Selection|object} [attributes.selection]               A collection to contain attachment selections within the state.
 *                                                                               If the 'selection' attribute is a plain JS object,
 *                                                                               a Selection will be created using its values as the selection instance's `props` model.
 *                                                                               Otherwise, it will copy the library's `props` model.
 * @param {boolean}                         [attributes.multiple=false]          Whether multi-select is enabled.
 * @param {string}                          [attributes.content=upload]          Initial mode for the content region.
 *                                                                               Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                          [attributes.menu=default]            Initial mode for the menu region.
 * @param {string}                          [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                          [attributes.toolbar=select]          Initial mode for the toolbar region.
 * @param {boolean}                         [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean|string}                  [attributes.filterable=false]        Whether the library is filterable, and if so what filters should be shown.
 *                                                                               Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                         [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                         [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                         [attributes.describe=false]          Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                         [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                         [attributes.syncSelection=true]      Whether the Attachments selection should be persisted from the last state.
 */
Library = wp.media.controller.State.extend(/** @lends wp.media.controller.Library.prototype */{
	defaults: {
		id:                 'library',
		title:              l10n.mediaLibraryTitle,
		multiple:           false,
		content:            'upload',
		menu:               'default',
		router:             'browse',
		toolbar:            'select',
		searchable:         true,
		filterable:         false,
		sortable:           true,
		autoSelect:         true,
		describe:           false,
		contentUserSetting: true,
		syncSelection:      true
	},

	/**
	 * If a library isn't provided, query all media items.
	 * If a selection instance isn't provided, create one.
	 *
	 * @since 3.5.0
	 */
	initialize: function() {
		var selection = this.get('selection'),
			props;

		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query() );
		}

		if ( ! ( selection instanceof wp.media.model.Selection ) ) {
			props = selection;

			if ( ! props ) {
				props = this.get('library').props.toJSON();
				props = _.omit( props, 'orderby', 'query' );
			}

			this.set( 'selection', new wp.media.model.Selection( null, {
				multiple: this.get('multiple'),
				props: props
			}) );
		}

		this.resetDisplays();
	},

	/**
	 * @since 3.5.0
	 */
	activate: function() {
		this.syncSelection();

		wp.Uploader.queue.on( 'add', this.uploading, this );

		this.get('selection').on( 'add remove reset', this.refreshContent, this );

		if ( this.get( 'router' ) && this.get('contentUserSetting') ) {
			this.frame.on( 'content:activate', this.saveContentMode, this );
			this.set( 'content', getUserSetting( 'libraryContent', this.get('content') ) );
		}
	},

	/**
	 * @since 3.5.0
	 */
	deactivate: function() {
		this.recordSelection();

		this.frame.off( 'content:activate', this.saveContentMode, this );

		// Unbind all event handlers that use this state as the context
		// from the selection.
		this.get('selection').off( null, null, this );

		wp.Uploader.queue.off( null, null, this );
	},

	/**
	 * Reset the library to its initial state.
	 *
	 * @since 3.5.0
	 */
	reset: function() {
		this.get('selection').reset();
		this.resetDisplays();
		this.refreshContent();
	},

	/**
	 * Reset the attachment display settings defaults to the site options.
	 *
	 * If site options don't define them, fall back to a persistent user setting.
	 *
	 * @since 3.5.0
	 */
	resetDisplays: function() {
		var defaultProps = wp.media.view.settings.defaultProps;
		this._displays = [];
		this._defaultDisplaySettings = {
			align: getUserSetting( 'align', defaultProps.align ) || 'none',
			size:  getUserSetting( 'imgsize', defaultProps.size ) || 'medium',
			link:  getUserSetting( 'urlbutton', defaultProps.link ) || 'none'
		};
	},

	/**
	 * Create a model to represent display settings (alignment, etc.) for an attachment.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @return {Backbone.Model}
	 */
	display: function( attachment ) {
		var displays = this._displays;

		if ( ! displays[ attachment.cid ] ) {
			displays[ attachment.cid ] = new Backbone.Model( this.defaultDisplaySettings( attachment ) );
		}
		return displays[ attachment.cid ];
	},

	/**
	 * Given an attachment, create attachment display settings properties.
	 *
	 * @since 3.6.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @return {Object}
	 */
	defaultDisplaySettings: function( attachment ) {
		var settings = _.clone( this._defaultDisplaySettings );

		settings.canEmbed = this.canEmbed( attachment );
		if ( settings.canEmbed ) {
			settings.link = 'embed';
		} else if ( ! this.isImageAttachment( attachment ) && settings.link === 'none' ) {
			settings.link = 'file';
		}

		return settings;
	},

	/**
	 * Whether an attachment is image.
	 *
	 * @since 4.4.1
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @return {boolean}
	 */
	isImageAttachment: function( attachment ) {
		// If uploading, we know the filename but not the mime type.
		if ( attachment.get('uploading') ) {
			return /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test( attachment.get('filename') );
		}

		return attachment.get('type') === 'image';
	},

	/**
	 * Whether an attachment can be embedded (audio or video).
	 *
	 * @since 3.6.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 * @return {boolean}
	 */
	canEmbed: function( attachment ) {
		// If uploading, we know the filename but not the mime type.
		if ( ! attachment.get('uploading') ) {
			var type = attachment.get('type');
			if ( type !== 'audio' && type !== 'video' ) {
				return false;
			}
		}

		return _.contains( wp.media.view.settings.embedExts, attachment.get('filename').split('.').pop() );
	},


	/**
	 * If the state is active, no items are selected, and the current
	 * content mode is not an option in the state's router (provided
	 * the state has a router), reset the content mode to the default.
	 *
	 * @since 3.5.0
	 */
	refreshContent: function() {
		var selection = this.get('selection'),
			frame = this.frame,
			router = frame.router.get(),
			mode = frame.content.mode();

		if ( this.active && ! selection.length && router && ! router.get( mode ) ) {
			this.frame.content.render( this.get('content') );
		}
	},

	/**
	 * Callback handler when an attachment is uploaded.
	 *
	 * Switch to the Media Library if uploaded from the 'Upload Files' tab.
	 *
	 * Adds any uploading attachments to the selection.
	 *
	 * If the state only supports one attachment to be selected and multiple
	 * attachments are uploaded, the last attachment in the upload queue will
	 * be selected.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 */
	uploading: function( attachment ) {
		var content = this.frame.content;

		if ( 'upload' === content.mode() ) {
			this.frame.content.mode('browse');
		}

		if ( this.get( 'autoSelect' ) ) {
			this.get('selection').add( attachment );
			this.frame.trigger( 'library:selection:add' );
		}
	},

	/**
	 * Persist the mode of the content region as a user setting.
	 *
	 * @since 3.5.0
	 */
	saveContentMode: function() {
		if ( 'browse' !== this.get('router') ) {
			return;
		}

		var mode = this.frame.content.mode(),
			view = this.frame.router.get();

		if ( view && view.get( mode ) ) {
			setUserSetting( 'libraryContent', mode );
		}
	}

});

// Make selectionSync available on any Media Library state.
_.extend( Library.prototype, wp.media.selectionSync );

module.exports = Library;


/***/ },

/***/ 8065
(module) {

/**
 * wp.media.controller.MediaLibrary
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
var Library = wp.media.controller.Library,
	MediaLibrary;

MediaLibrary = Library.extend(/** @lends wp.media.controller.MediaLibrary.prototype */{
	defaults: _.defaults({
		// Attachments browser defaults. @see media.view.AttachmentsBrowser
		filterable:      'uploaded',

		displaySettings: false,
		priority:        80,
		syncSelection:   false
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options
	 */
	initialize: function( options ) {
		this.media = options.media;
		this.type = options.type;
		this.set( 'library', wp.media.query({ type: this.type }) );

		Library.prototype.initialize.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		// @todo this should use this.frame.
		if ( wp.media.frame.lastMime ) {
			this.set( 'library', wp.media.query({ type: wp.media.frame.lastMime }) );
			delete wp.media.frame.lastMime;
		}
		Library.prototype.activate.apply( this, arguments );
	}
});

module.exports = MediaLibrary;


/***/ },

/***/ 9875
(module) {

/**
 * wp.media.controller.Region
 *
 * A region is a persistent application layout area.
 *
 * A region assumes one mode at any time, and can be switched to another.
 *
 * When mode changes, events are triggered on the region's parent view.
 * The parent view will listen to specific events and fill the region with an
 * appropriate view depending on mode. For example, a frame listens for the
 * 'browse' mode t be activated on the 'content' view and then fills the region
 * with an AttachmentsBrowser view.
 *
 * @memberOf wp.media.controller
 *
 * @class
 *
 * @param {Object}        options          Options hash for the region.
 * @param {string}        options.id       Unique identifier for the region.
 * @param {Backbone.View} options.view     A parent view the region exists within.
 * @param {string}        options.selector jQuery selector for the region within the parent view.
 */
var Region = function( options ) {
	_.extend( this, _.pick( options || {}, 'id', 'view', 'selector' ) );
};

// Use Backbone's self-propagating `extend` inheritance method.
Region.extend = Backbone.Model.extend;

_.extend( Region.prototype,/** @lends wp.media.controller.Region.prototype */{
	/**
	 * Activate a mode.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} mode
	 *
	 * @fires Region#activate
	 * @fires Region#deactivate
	 *
	 * @return {wp.media.controller.Region} Returns itself to allow chaining.
	 */
	mode: function( mode ) {
		if ( ! mode ) {
			return this._mode;
		}
		// Bail if we're trying to change to the current mode.
		if ( mode === this._mode ) {
			return this;
		}

		/**
		 * Region mode deactivation event.
		 *
		 * @event wp.media.controller.Region#deactivate
		 */
		this.trigger('deactivate');

		this._mode = mode;
		this.render( mode );

		/**
		 * Region mode activation event.
		 *
		 * @event wp.media.controller.Region#activate
		 */
		this.trigger('activate');
		return this;
	},
	/**
	 * Render a mode.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} mode
	 *
	 * @fires Region#create
	 * @fires Region#render
	 *
	 * @return {wp.media.controller.Region} Returns itself to allow chaining.
	 */
	render: function( mode ) {
		// If the mode isn't active, activate it.
		if ( mode && mode !== this._mode ) {
			return this.mode( mode );
		}

		var set = { view: null },
			view;

		/**
		 * Create region view event.
		 *
		 * Region view creation takes place in an event callback on the frame.
		 *
		 * @event wp.media.controller.Region#create
		 * @type {object}
		 * @property {object} view
		 */
		this.trigger( 'create', set );
		view = set.view;

		/**
		 * Render region view event.
		 *
		 * Region view creation takes place in an event callback on the frame.
		 *
		 * @event wp.media.controller.Region#render
		 * @type {object}
		 */
		this.trigger( 'render', view );
		if ( view ) {
			this.set( view );
		}
		return this;
	},

	/**
	 * Get the region's view.
	 *
	 * @since 3.5.0
	 *
	 * @return {wp.media.View}
	 */
	get: function() {
		return this.view.views.first( this.selector );
	},

	/**
	 * Set the region's view as a subview of the frame.
	 *
	 * @since 3.5.0
	 *
	 * @param {Array|Object} views
	 * @param {Object} [options={}]
	 * @return {wp.Backbone.Subviews} Subviews is returned to allow chaining.
	 */
	set: function( views, options ) {
		if ( options ) {
			options.add = false;
		}
		return this.view.views.set( this.selector, views, options );
	},

	/**
	 * Trigger regional view events on the frame.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} event
	 * @return {undefined|wp.media.controller.Region} Returns itself to allow chaining.
	 */
	trigger: function( event ) {
		var base, args;

		if ( ! this._mode ) {
			return;
		}

		args = _.toArray( arguments );
		base = this.id + ':' + event;

		// Trigger `{this.id}:{event}:{this._mode}` event on the frame.
		args[0] = base + ':' + this._mode;
		this.view.trigger.apply( this.view, args );

		// Trigger `{this.id}:{event}` event on the frame.
		args[0] = base;
		this.view.trigger.apply( this.view, args );
		return this;
	}
});

module.exports = Region;


/***/ },

/***/ 2275
(module) {

var Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	ReplaceImage;

/**
 * wp.media.controller.ReplaceImage
 *
 * A state for replacing an image.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Library
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 *
 * @param {object}                     [attributes]                         The attributes hash passed to the state.
 * @param {string}                     [attributes.id=replace-image]        Unique identifier.
 * @param {string}                     [attributes.title=Replace Image]     Title for the state. Displays in the media menu and the frame's title region.
 * @param {wp.media.model.Attachments} [attributes.library]                 The attachments collection to browse.
 *                                                                          If one is not supplied, a collection of all images will be created.
 * @param {boolean}                    [attributes.multiple=false]          Whether multi-select is enabled.
 * @param {string}                     [attributes.content=upload]          Initial mode for the content region.
 *                                                                          Overridden by persistent user setting if 'contentUserSetting' is true.
 * @param {string}                     [attributes.menu=default]            Initial mode for the menu region.
 * @param {string}                     [attributes.router=browse]           Initial mode for the router region.
 * @param {string}                     [attributes.toolbar=replace]         Initial mode for the toolbar region.
 * @param {int}                        [attributes.priority=60]             The priority for the state link in the media menu.
 * @param {boolean}                    [attributes.searchable=true]         Whether the library is searchable.
 * @param {boolean|string}             [attributes.filterable=uploaded]     Whether the library is filterable, and if so what filters should be shown.
 *                                                                          Accepts 'all', 'uploaded', or 'unattached'.
 * @param {boolean}                    [attributes.sortable=true]           Whether the Attachments should be sortable. Depends on the orderby property being set to menuOrder on the attachments collection.
 * @param {boolean}                    [attributes.autoSelect=true]         Whether an uploaded attachment should be automatically added to the selection.
 * @param {boolean}                    [attributes.describe=false]          Whether to offer UI to describe attachments - e.g. captioning images in a gallery.
 * @param {boolean}                    [attributes.contentUserSetting=true] Whether the content region's mode should be set and persisted per user.
 * @param {boolean}                    [attributes.syncSelection=true]      Whether the Attachments selection should be persisted from the last state.
 */
ReplaceImage = Library.extend(/** @lends wp.media.controller.ReplaceImage.prototype */{
	defaults: _.defaults({
		id:            'replace-image',
		title:         l10n.replaceImageTitle,
		multiple:      false,
		filterable:    'uploaded',
		toolbar:       'replace',
		menu:          false,
		priority:      60,
		syncSelection: true
	}, Library.prototype.defaults ),

	/**
	 * @since 3.9.0
	 *
	 * @param options
	 */
	initialize: function( options ) {
		var library, comparator;

		this.image = options.image;
		// If we haven't been provided a `library`, create a `Selection`.
		if ( ! this.get('library') ) {
			this.set( 'library', wp.media.query({ type: 'image' }) );
		}

		Library.prototype.initialize.apply( this, arguments );

		library    = this.get('library');
		comparator = library.comparator;

		// Overload the library's comparator to push items that are not in
		// the mirrored query to the front of the aggregate collection.
		library.comparator = function( a, b ) {
			var aInQuery = !! this.mirroring.get( a.cid ),
				bInQuery = !! this.mirroring.get( b.cid );

			if ( ! aInQuery && bInQuery ) {
				return -1;
			} else if ( aInQuery && ! bInQuery ) {
				return 1;
			} else {
				return comparator.apply( this, arguments );
			}
		};

		// Add all items in the selection to the library, so any featured
		// images that are not initially loaded still appear.
		library.observe( this.get('selection') );
	},

	/**
	 * @since 3.9.0
	 */
	activate: function() {
		this.frame.on( 'content:render:browse', this.updateSelection, this );

		Library.prototype.activate.apply( this, arguments );
	},

	/**
	 * @since 5.9.0
	 */
	deactivate: function() {
		this.frame.off( 'content:render:browse', this.updateSelection, this );

		Library.prototype.deactivate.apply( this, arguments );
	},

	/**
	 * @since 3.9.0
	 */
	updateSelection: function() {
		var selection = this.get('selection'),
			attachment = this.image.attachment;

		selection.reset( attachment ? [ attachment ] : [] );
	}
});

module.exports = ReplaceImage;


/***/ },

/***/ 6172
(module) {

var Controller = wp.media.controller,
	SiteIconCropper;

/**
 * wp.media.controller.SiteIconCropper
 *
 * A state for cropping a Site Icon.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments wp.media.controller.Cropper
 * @augments wp.media.controller.State
 * @augments Backbone.Model
 */
SiteIconCropper = Controller.Cropper.extend(/** @lends wp.media.controller.SiteIconCropper.prototype */{
	activate: function() {
		this.frame.on( 'content:create:crop', this.createCropContent, this );
		this.frame.on( 'close', this.removeCropper, this );
		this.set('selection', new Backbone.Collection(this.frame._selection.single));
	},

	createCropContent: function() {
		this.cropperView = new wp.media.view.SiteIconCropper({
			controller: this,
			attachment: this.get('selection').first()
		});
		this.cropperView.on('image-loaded', this.createCropToolbar, this);
		this.frame.content.set(this.cropperView);

	},

	doCrop: function( attachment ) {
		var cropDetails = attachment.get( 'cropDetails' ),
			control = this.get( 'control' );

		cropDetails.dst_width  = control.params.width;
		cropDetails.dst_height = control.params.height;

		return wp.ajax.post( 'crop-image', {
			nonce: attachment.get( 'nonces' ).edit,
			id: attachment.get( 'id' ),
			context: 'site-icon',
			cropDetails: cropDetails
		} );
	}
});

module.exports = SiteIconCropper;


/***/ },

/***/ 6150
(module) {

/**
 * wp.media.controller.StateMachine
 *
 * A state machine keeps track of state. It is in one state at a time,
 * and can change from one state to another.
 *
 * States are stored as models in a Backbone collection.
 *
 * @memberOf wp.media.controller
 *
 * @since 3.5.0
 *
 * @class
 * @augments Backbone.Model
 * @mixin
 * @mixes Backbone.Events
 */
var StateMachine = function() {
	return {
		// Use Backbone's self-propagating `extend` inheritance method.
		extend: Backbone.Model.extend
	};
};

_.extend( StateMachine.prototype, Backbone.Events,/** @lends wp.media.controller.StateMachine.prototype */{
	/**
	 * Fetch a state.
	 *
	 * If no `id` is provided, returns the active state.
	 *
	 * Implicitly creates states.
	 *
	 * Ensure that the `states` collection exists so the `StateMachine`
	 * can be used as a mixin.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} id
	 * @return {wp.media.controller.State} Returns a State model from
	 *                                     the StateMachine collection.
	 */
	state: function( id ) {
		this.states = this.states || new Backbone.Collection();

		// Default to the active state.
		id = id || this._state;

		if ( id && ! this.states.get( id ) ) {
			this.states.add({ id: id });
		}
		return this.states.get( id );
	},

	/**
	 * Sets the active state.
	 *
	 * Bail if we're trying to select the current state, if we haven't
	 * created the `states` collection, or are trying to select a state
	 * that does not exist.
	 *
	 * @since 3.5.0
	 *
	 * @param {string} id
	 *
	 * @fires wp.media.controller.State#deactivate
	 * @fires wp.media.controller.State#activate
	 *
	 * @return {wp.media.controller.StateMachine} Returns itself to allow chaining.
	 */
	setState: function( id ) {
		var previous = this.state();

		if ( ( previous && id === previous.id ) || ! this.states || ! this.states.get( id ) ) {
			return this;
		}

		if ( previous ) {
			previous.trigger('deactivate');
			this._lastState = previous.id;
		}

		this._state = id;
		this.state().trigger('activate');

		return this;
	},

	/**
	 * Returns the previous active state.
	 *
	 * Call the `state()` method with no parameters to retrieve the current
	 * active state.
	 *
	 * @since 3.5.0
	 *
	 * @return {wp.media.controller.State} Returns a State model from
	 *                                     the StateMachine collection.
	 */
	lastState: function() {
		if ( this._lastState ) {
			return this.state( this._lastState );
		}
	}
});

// Map all event binding and triggering on a StateMachine to its `states` collection.
_.each([ 'on', 'off', 'trigger' ], function( method ) {
	/**
	 * @function on
	 * @memberOf wp.media.controller.StateMachine
	 * @instance
	 * @return {wp.media.controller.StateMachine} Returns itself to allow chaining.
	 */
	/**
	 * @function off
	 * @memberOf wp.media.controller.StateMachine
	 * @instance
	 * @return {wp.media.controller.StateMachine} Returns itself to allow chaining.
	 */
	/**
	 * @function trigger
	 * @memberOf wp.media.controller.StateMachine
	 * @instance
	 * @return {wp.media.controller.StateMachine} Returns itself to allow chaining.
	 */
	StateMachine.prototype[ method ] = function() {
		// Ensure that the `states` collection exists so the `StateMachine`
		// can be used as a mixin.
		this.states = this.states || new Backbone.Collection();
		// Forward the method to the `states` collection.
		this.states[ method ].apply( this.states, arguments );
		return this;
	};
});

module.exports = StateMachine;


/***/ },

/***/ 5694
(module) {

/**
 * wp.media.controller.State
 *
 * A state is a step in a workflow that when set will trigger the controllers
 * for the regions to be updated as specified in the frame.
 *
 * A state has an event-driven lifecycle:
 *
 *     'ready'      triggers when a state is added to a state machine's collection.
 *     'activate'   triggers when a state is activated by a state machine.
 *     'deactivate' triggers when a state is deactivated by a state machine.
 *     'reset'      is not triggered automatically. It should be invoked by the
 *                  proper controller to reset the state to its default.
 *
 * @memberOf wp.media.controller
 *
 * @class
 * @augments Backbone.Model
 */
var State = Backbone.Model.extend(/** @lends wp.media.controller.State.prototype */{
	/**
	 * Constructor.
	 *
	 * @since 3.5.0
	 */
	constructor: function() {
		this.on( 'activate', this._preActivate, this );
		this.on( 'activate', this.activate, this );
		this.on( 'activate', this._postActivate, this );
		this.on( 'deactivate', this._deactivate, this );
		this.on( 'deactivate', this.deactivate, this );
		this.on( 'reset', this.reset, this );
		this.on( 'ready', this._ready, this );
		this.on( 'ready', this.ready, this );
		/**
		 * Call parent constructor with passed arguments
		 */
		Backbone.Model.apply( this, arguments );
		this.on( 'change:menu', this._updateMenu, this );
	},
	/**
	 * Ready event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	ready: function() {},

	/**
	 * Activate event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	activate: function() {},

	/**
	 * Deactivate event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	deactivate: function() {},

	/**
	 * Reset event callback.
	 *
	 * @abstract
	 * @since 3.5.0
	 */
	reset: function() {},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_ready: function() {
		this._updateMenu();
	},

	/**
	 * @since 3.5.0
	 * @access private
	*/
	_preActivate: function() {
		this.active = true;
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_postActivate: function() {
		this.on( 'change:menu', this._menu, this );
		this.on( 'change:titleMode', this._title, this );
		this.on( 'change:content', this._content, this );
		this.on( 'change:toolbar', this._toolbar, this );

		this.frame.on( 'title:render:default', this._renderTitle, this );

		this._title();
		this._menu();
		this._toolbar();
		this._content();
		this._router();
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_deactivate: function() {
		this.active = false;

		this.frame.off( 'title:render:default', this._renderTitle, this );

		this.off( 'change:menu', this._menu, this );
		this.off( 'change:titleMode', this._title, this );
		this.off( 'change:content', this._content, this );
		this.off( 'change:toolbar', this._toolbar, this );
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_title: function() {
		this.frame.title.render( this.get('titleMode') || 'default' );
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_renderTitle: function( view ) {
		view.$el.text( this.get('title') || '' );
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_router: function() {
		var router = this.frame.router,
			mode = this.get('router'),
			view;

		this.frame.$el.toggleClass( 'hide-router', ! mode );
		if ( ! mode ) {
			return;
		}

		this.frame.router.render( mode );

		view = router.get();
		if ( view && view.select ) {
			view.select( this.frame.content.mode() );
		}
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_menu: function() {
		var menu = this.frame.menu,
			mode = this.get('menu'),
			actionMenuItems,
			actionMenuLength,
			view;

		if ( this.frame.menu ) {
			actionMenuItems = this.frame.menu.get('views'),
			actionMenuLength = actionMenuItems ? actionMenuItems.views.get().length : 0,
			// Show action menu only if it is active and has more than one default element.
			this.frame.$el.toggleClass( 'hide-menu', ! mode || actionMenuLength < 2 );
		}
		if ( ! mode ) {
			return;
		}

		menu.mode( mode );

		view = menu.get();
		if ( view && view.select ) {
			view.select( this.id );
		}
	},

	/**
	 * @since 3.5.0
	 * @access private
	 */
	_updateMenu: function() {
		var previous = this.previous('menu'),
			menu = this.get('menu');

		if ( previous ) {
			this.frame.off( 'menu:render:' + previous, this._renderMenu, this );
		}

		if ( menu ) {
			this.frame.on( 'menu:render:' + menu, this._renderMenu, this );
		}
	},

	/**
	 * Create a view in the media menu for the state.
	 *
	 * @since 3.5.0
	 * @access private
	 *
	 * @param {media.view.Menu} view The menu view.
	 */
	_renderMenu: function( view ) {
		var menuItem = this.get('menuItem'),
			title = this.get('title'),
			priority = this.get('priority');

		if ( ! menuItem && title ) {
			menuItem = { text: title };

			if ( priority ) {
				menuItem.priority = priority;
			}
		}

		if ( ! menuItem ) {
			return;
		}

		view.set( this.id, menuItem );
	}
});

_.each(['toolbar','content'], function( region ) {
	/**
	 * @access private
	 */
	State.prototype[ '_' + region ] = function() {
		var mode = this.get( region );
		if ( mode ) {
			this.frame[ region ].render( mode );
		}
	};
});

module.exports = State;


/***/ },

/***/ 4181
(module) {

/**
 * wp.media.selectionSync
 *
 * Sync an attachments selection in a state with another state.
 *
 * Allows for selecting multiple images in the Add Media workflow, and then
 * switching to the Insert Gallery workflow while preserving the attachments selection.
 *
 * @memberOf wp.media
 *
 * @mixin
 */
var selectionSync = {
	/**
	 * @since 3.5.0
	 */
	syncSelection: function() {
		var selection = this.get('selection'),
			manager = this.frame._selection;

		if ( ! this.get('syncSelection') || ! manager || ! selection ) {
			return;
		}

		/*
		 * If the selection supports multiple items, validate the stored
		 * attachments based on the new selection's conditions. Record
		 * the attachments that are not included; we'll maintain a
		 * reference to those. Other attachments are considered in flux.
		 */
		if ( selection.multiple ) {
			selection.reset( [], { silent: true });
			selection.validateAll( manager.attachments );
			manager.difference = _.difference( manager.attachments.models, selection.models );
		}

		// Sync the selection's single item with the master.
		selection.single( manager.single );
	},

	/**
	 * Record the currently active attachments, which is a combination
	 * of the selection's attachments and the set of selected
	 * attachments that this specific selection considered invalid.
	 * Reset the difference and record the single attachment.
	 *
	 * @since 3.5.0
	 */
	recordSelection: function() {
		var selection = this.get('selection'),
			manager = this.frame._selection;

		if ( ! this.get('syncSelection') || ! manager || ! selection ) {
			return;
		}

		if ( selection.multiple ) {
			manager.attachments.reset( selection.toArray().concat( manager.difference ) );
			manager.difference = [];
		} else {
			manager.attachments.add( selection.toArray() );
		}

		manager.single = selection._single;
	}
};

module.exports = selectionSync;


/***/ },

/***/ 2982
(module) {

var View = wp.media.View,
	AttachmentCompat;

/**
 * wp.media.view.AttachmentCompat
 *
 * A view to display fields added via the `attachment_fields_to_edit` filter.
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
AttachmentCompat = View.extend(/** @lends wp.media.view.AttachmentCompat.prototype */{
	tagName:   'form',
	className: 'compat-item',

	events: {
		'submit':          'preventDefault',
		'change input':    'save',
		'change select':   'save',
		'change textarea': 'save'
	},

	initialize: function() {
		// Render the view when a new item is added.
		this.listenTo( this.model, 'add', this.render );
	},

	/**
	 * @return {wp.media.view.AttachmentCompat} Returns itself to allow chaining.
	 */
	dispose: function() {
		if ( this.$(':focus').length ) {
			this.save();
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		return View.prototype.dispose.apply( this, arguments );
	},
	/**
	 * @return {wp.media.view.AttachmentCompat} Returns itself to allow chaining.
	 */
	render: function() {
		var compat = this.model.get('compat');
		if ( ! compat || ! compat.item ) {
			return;
		}

		this.views.detach();
		this.$el.html( compat.item );
		this.views.render();
		return this;
	},
	/**
	 * @param {Object} event
	 */
	preventDefault: function( event ) {
		event.preventDefault();
	},
	/**
	 * @param {Object} event
	 */
	save: function( event ) {
		var data = {};

		if ( event ) {
			event.preventDefault();
		}

		_.each( this.$el.serializeArray(), function( pair ) {
			data[ pair.name ] = pair.value;
		});

		this.controller.trigger( 'attachment:compat:waiting', ['waiting'] );
		this.model.saveCompat( data ).always( _.bind( this.postSave, this ) );
	},

	postSave: function() {
		this.controller.trigger( 'attachment:compat:ready', ['ready'] );
	}
});

module.exports = AttachmentCompat;


/***/ },

/***/ 7709
(module) {

var $ = jQuery,
	AttachmentFilters;

/**
 * wp.media.view.AttachmentFilters
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
AttachmentFilters = wp.media.View.extend(/** @lends wp.media.view.AttachmentFilters.prototype */{
	tagName:   'select',
	className: 'attachment-filters',
	id:        'media-attachment-filters',

	events: {
		change: 'change'
	},

	keys: [],

	initialize: function() {
		this.createFilters();
		_.extend( this.filters, this.options.filters );

		// Build `<option>` elements.
		this.$el.html( _.chain( this.filters ).map( function( filter, value ) {
			return {
				el: $( '<option></option>' ).val( value ).html( filter.text )[0],
				priority: filter.priority || 50
			};
		}, this ).sortBy('priority').pluck('el').value() );

		this.listenTo( this.model, 'change', this.select );
		this.select();
	},

	/**
	 * @abstract
	 */
	createFilters: function() {
		this.filters = {};
	},

	/**
	 * When the selected filter changes, update the Attachment Query properties to match.
	 */
	change: function() {
		var filter = this.filters[ this.el.value ];
		if ( filter ) {
			this.model.set( filter.props );
		}
	},

	select: function() {
		var model = this.model,
			value = 'all',
			props = model.toJSON();

		_.find( this.filters, function( filter, id ) {
			var equal = _.all( filter.props, function( prop, key ) {
				return prop === ( _.isUndefined( props[ key ] ) ? null : props[ key ] );
			});

			if ( equal ) {
				return value = id;
			}
		});

		this.$el.val( value );
	}
});

module.exports = AttachmentFilters;


/***/ },

/***/ 7349
(module) {

var l10n = wp.media.view.l10n,
	All;

/**
 * wp.media.view.AttachmentFilters.All
 *
 * @memberOf wp.media.view.AttachmentFilters
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
All = wp.media.view.AttachmentFilters.extend(/** @lends wp.media.view.AttachmentFilters.All.prototype */{
	createFilters: function() {
		var filters = {},
			uid = window.userSettings ? parseInt( window.userSettings.uid, 10 ) : 0;

		_.each( wp.media.view.settings.mimeTypes || {}, function( text, key ) {
			filters[ key ] = {
				text: text,
				props: {
					status:  null,
					type:    key,
					uploadedTo: null,
					orderby: 'date',
					order:   'DESC',
					author:  null
				}
			};
		});

		filters.all = {
			text:  l10n.allMediaItems,
			props: {
				status:  null,
				type:    null,
				uploadedTo: null,
				orderby: 'date',
				order:   'DESC',
				author:  null
			},
			priority: 10
		};

		if ( wp.media.view.settings.post.id ) {
			filters.uploaded = {
				text:  l10n.uploadedToThisPost,
				props: {
					status:  null,
					type:    null,
					uploadedTo: wp.media.view.settings.post.id,
					orderby: 'menuOrder',
					order:   'ASC',
					author:  null
				},
				priority: 20
			};
		}

		filters.unattached = {
			text:  l10n.unattached,
			props: {
				status:     null,
				uploadedTo: 0,
				type:       null,
				orderby:    'menuOrder',
				order:      'ASC',
				author:     null
			},
			priority: 50
		};

		if ( uid ) {
			filters.mine = {
				text:  l10n.mine,
				props: {
					status:		null,
					type:		null,
					uploadedTo:	null,
					orderby:	'date',
					order:		'DESC',
					author:		uid
				},
				priority: 50
			};
		}

		if ( wp.media.view.settings.mediaTrash &&
			this.controller.isModeActive( 'grid' ) ) {

			filters.trash = {
				text:  l10n.trash,
				props: {
					uploadedTo: null,
					status:     'trash',
					type:       null,
					orderby:    'date',
					order:      'DESC',
					author:     null
				},
				priority: 50
			};
		}

		this.filters = filters;
	}
});

module.exports = All;


/***/ },

/***/ 6472
(module) {

var l10n = wp.media.view.l10n,
	DateFilter;

/**
 * A filter dropdown for month/dates.
 *
 * @memberOf wp.media.view.AttachmentFilters
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
DateFilter = wp.media.view.AttachmentFilters.extend(/** @lends wp.media.view.AttachmentFilters.Date.prototype */{
	id: 'media-attachment-date-filters',

	createFilters: function() {
		var filters = {};
		_.each( wp.media.view.settings.months || {}, function( value, index ) {
			filters[ index ] = {
				text: value.text,
				props: {
					year: value.year,
					monthnum: value.month
				}
			};
		});
		filters.all = {
			text:  l10n.allDates,
			props: {
				monthnum: false,
				year:  false
			},
			priority: 10
		};
		this.filters = filters;
	}
});

module.exports = DateFilter;


/***/ },

/***/ 1368
(module) {

var l10n = wp.media.view.l10n,
	Uploaded;

/**
 * wp.media.view.AttachmentFilters.Uploaded
 *
 * @memberOf wp.media.view.AttachmentFilters
 *
 * @class
 * @augments wp.media.view.AttachmentFilters
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Uploaded = wp.media.view.AttachmentFilters.extend(/** @lends wp.media.view.AttachmentFilters.Uploaded.prototype */{
	createFilters: function() {
		var type = this.model.get('type'),
			types = wp.media.view.settings.mimeTypes,
			uid = window.userSettings ? parseInt( window.userSettings.uid, 10 ) : 0,
			text;

		if ( types && type ) {
			text = types[ type ];
		}

		this.filters = {
			all: {
				text:  text || l10n.allMediaItems,
				props: {
					uploadedTo: null,
					orderby: 'date',
					order:   'DESC',
					author:	 null
				},
				priority: 10
			},

			uploaded: {
				text:  l10n.uploadedToThisPost,
				props: {
					uploadedTo: wp.media.view.settings.post.id,
					orderby: 'menuOrder',
					order:   'ASC',
					author:	 null
				},
				priority: 20
			},

			unattached: {
				text:  l10n.unattached,
				props: {
					uploadedTo: 0,
					orderby: 'menuOrder',
					order:   'ASC',
					author:	 null
				},
				priority: 50
			}
		};

		if ( uid ) {
			this.filters.mine = {
				text:  l10n.mine,
				props: {
					orderby: 'date',
					order:   'DESC',
					author:  uid
				},
				priority: 50
			};
		}
	}
});

module.exports = Uploaded;


/***/ },

/***/ 4075
(module) {

var View = wp.media.View,
	$ = jQuery,
	Attachment;

/**
 * wp.media.view.Attachment
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Attachment = View.extend(/** @lends wp.media.view.Attachment.prototype */{
	tagName:   'li',
	className: 'attachment',
	template:  wp.template('attachment'),

	attributes: function() {
		var ariaLabel = this.model.get( 'title' );

		if ( ! ariaLabel ) {
			if ( this.model.get( 'uploading' ) ) {
				ariaLabel = wp.i18n.__( 'uploading…' );
			} else {
				ariaLabel = wp.i18n.__( '(no title)' );
			}
		}

		return {
			'tabIndex':     0,
			'role':         'checkbox',
			'aria-label':   ariaLabel,
			'aria-checked': false,
			'data-id':      this.model.get( 'id' )
		};
	},

	events: {
		'click':                          'toggleSelectionHandler',
		'change [data-setting]':          'updateSetting',
		'change [data-setting] input':    'updateSetting',
		'change [data-setting] select':   'updateSetting',
		'change [data-setting] textarea': 'updateSetting',
		'click .attachment-close':        'removeFromLibrary',
		'click .check':                   'checkClickHandler',
		'keydown':                        'toggleSelectionHandler'
	},

	buttons: {},

	initialize: function() {
		var selection = this.options.selection,
			options = _.defaults( this.options, {
				rerenderOnModelChange: true
			} );

		if ( options.rerenderOnModelChange ) {
			this.listenTo( this.model, 'change', this.render );
		} else {
			this.listenTo( this.model, 'change:percent', this.progress );
		}
		this.listenTo( this.model, 'change:title', this._syncTitle );
		this.listenTo( this.model, 'change:caption', this._syncCaption );
		this.listenTo( this.model, 'change:artist', this._syncArtist );
		this.listenTo( this.model, 'change:album', this._syncAlbum );

		// Update the selection.
		this.listenTo( this.model, 'add', this.select );
		this.listenTo( this.model, 'remove', this.deselect );
		if ( selection ) {
			selection.on( 'reset', this.updateSelect, this );
			// Update the model's details view.
			this.listenTo( this.model, 'selection:single selection:unsingle', this.details );
			this.details( this.model, this.controller.state().get('selection') );
		}

		this.listenTo( this.controller.states, 'attachment:compat:waiting attachment:compat:ready', this.updateSave );
	},
	/**
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	dispose: function() {
		var selection = this.options.selection;

		// Make sure all settings are saved before removing the view.
		this.updateAll();

		if ( selection ) {
			selection.off( null, null, this );
		}
		/**
		 * call 'dispose' directly on the parent class
		 */
		View.prototype.dispose.apply( this, arguments );
		return this;
	},
	/**
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	render: function() {
		var options = _.defaults( this.model.toJSON(), {
				orientation:   'landscape',
				uploading:     false,
				type:          '',
				subtype:       '',
				icon:          '',
				filename:      '',
				caption:       '',
				title:         '',
				dateFormatted: '',
				width:         '',
				height:        '',
				compat:        false,
				alt:           '',
				description:   ''
			}, this.options );

		options.buttons  = this.buttons;
		options.describe = this.controller.state().get('describe');

		if ( 'image' === options.type ) {
			options.size = this.imageSize();
		}

		options.can = {};
		if ( options.nonces ) {
			options.can.remove = !! options.nonces['delete'];
			options.can.save = !! options.nonces.update;
		}

		if ( this.controller.state().get('allowLocalEdits') && ! options.uploading ) {
			options.allowLocalEdits = true;
		}

		if ( options.uploading && ! options.percent ) {
			options.percent = 0;
		}

		this.views.detach();
		this.$el.html( this.template( options ) );

		this.$el.toggleClass( 'uploading', options.uploading );

		if ( options.uploading ) {
			this.$bar = this.$('.media-progress-bar div');
		} else {
			delete this.$bar;
		}

		// Check if the model is selected.
		this.updateSelect();

		// Update the save status.
		this.updateSave();

		this.views.render();

		return this;
	},

	progress: function() {
		if ( this.$bar && this.$bar.length ) {
			this.$bar.width( this.model.get('percent') + '%' );
		}
	},

	/**
	 * @param {Object} event
	 */
	toggleSelectionHandler: function( event ) {
		var method;

		// Don't do anything inside inputs and on the attachment check and remove buttons.
		if ( 'INPUT' === event.target.nodeName || 'BUTTON' === event.target.nodeName ) {
			return;
		}

		// Catch arrow events.
		if ( 37 === event.keyCode || 38 === event.keyCode || 39 === event.keyCode || 40 === event.keyCode ) {
			this.controller.trigger( 'attachment:keydown:arrow', event );
			return;
		}

		// Catch enter and space events.
		if ( 'keydown' === event.type && 13 !== event.keyCode && 32 !== event.keyCode ) {
			return;
		}

		event.preventDefault();

		// In the grid view, bubble up an edit:attachment event to the controller.
		if ( this.controller.isModeActive( 'grid' ) ) {
			if ( this.controller.isModeActive( 'edit' ) ) {
				// Pass the current target to restore focus when closing.
				this.controller.trigger( 'edit:attachment', this.model, event.currentTarget );
				return;
			}

			if ( this.controller.isModeActive( 'select' ) ) {
				method = 'toggle';
			}
		}

		if ( event.shiftKey ) {
			method = 'between';
		} else if ( event.ctrlKey || event.metaKey ) {
			method = 'toggle';
		}

		// Avoid toggles when the command or control key is pressed with the enter key to prevent deselecting the last selected attachment.
		if ( ( event.metaKey || event.ctrlKey ) && ( 13 === event.keyCode || 10 === event.keyCode ) ) {
			return;
		}

		this.toggleSelection({
			method: method
		});

		this.controller.trigger( 'selection:toggle' );
	},
	/**
	 * @param {Object} options
	 */
	toggleSelection: function( options ) {
		var collection = this.collection,
			selection = this.options.selection,
			model = this.model,
			method = options && options.method,
			single, models, singleIndex, modelIndex;

		if ( ! selection ) {
			return;
		}

		single = selection.single();
		method = _.isUndefined( method ) ? selection.multiple : method;

		// If the `method` is set to `between`, select all models that
		// exist between the current and the selected model.
		if ( 'between' === method && single && selection.multiple ) {
			// If the models are the same, short-circuit.
			if ( single === model ) {
				return;
			}

			singleIndex = collection.indexOf( single );
			modelIndex  = collection.indexOf( this.model );

			if ( singleIndex < modelIndex ) {
				models = collection.models.slice( singleIndex, modelIndex + 1 );
			} else {
				models = collection.models.slice( modelIndex, singleIndex + 1 );
			}

			selection.add( models );
			selection.single( model );
			return;

		// If the `method` is set to `toggle`, just flip the selection
		// status, regardless of whether the model is the single model.
		} else if ( 'toggle' === method ) {
			selection[ this.selected() ? 'remove' : 'add' ]( model );
			selection.single( model );
			return;
		} else if ( 'add' === method ) {
			selection.add( model );
			selection.single( model );
			return;
		}

		// Fixes bug that loses focus when selecting a featured image.
		if ( ! method ) {
			method = 'add';
		}

		if ( method !== 'add' ) {
			method = 'reset';
		}

		if ( this.selected() ) {
			/*
			 * If the model is the single model, remove it.
			 * If it is not the same as the single model,
			 * it now becomes the single model.
			 */
			selection[ single === model ? 'remove' : 'single' ]( model );
		} else {
			/*
			 * If the model is not selected, run the `method` on the
			 * selection. By default, we `reset` the selection, but the
			 * `method` can be set to `add` the model to the selection.
			 */
			selection[ method ]( model );
			selection.single( model );
		}
	},

	updateSelect: function() {
		this[ this.selected() ? 'select' : 'deselect' ]();
	},
	/**
	 * @return {unresolved|boolean}
	 */
	selected: function() {
		var selection = this.options.selection;
		if ( selection ) {
			return !! selection.get( this.model.cid );
		}
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	select: function( model, collection ) {
		var selection = this.options.selection,
			controller = this.controller;

		/*
		 * Check if a selection exists and if it's the collection provided.
		 * If they're not the same collection, bail; we're in another
		 * selection's event loop.
		 */
		if ( ! selection || ( collection && collection !== selection ) ) {
			return;
		}

		// Bail if the model is already selected.
		if ( this.$el.hasClass( 'selected' ) ) {
			return;
		}

		// Add 'selected' class to model, set aria-checked to true.
		this.$el.addClass( 'selected' ).attr( 'aria-checked', true );
		//  Make the checkbox tabable, except in media grid (bulk select mode).
		if ( ! ( controller.isModeActive( 'grid' ) && controller.isModeActive( 'select' ) ) ) {
			this.$( '.check' ).attr( 'tabindex', '0' );
		}
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	deselect: function( model, collection ) {
		var selection = this.options.selection;

		/*
		 * Check if a selection exists and if it's the collection provided.
		 * If they're not the same collection, bail; we're in another
		 * selection's event loop.
		 */
		if ( ! selection || ( collection && collection !== selection ) ) {
			return;
		}
		this.$el.removeClass( 'selected' ).attr( 'aria-checked', false )
			.find( '.check' ).attr( 'tabindex', '-1' );
	},
	/**
	 * @param {Backbone.Model} model
	 * @param {Backbone.Collection} collection
	 */
	details: function( model, collection ) {
		var selection = this.options.selection,
			details;

		if ( selection !== collection ) {
			return;
		}

		details = selection.single();
		this.$el.toggleClass( 'details', details === this.model );
	},
	/**
	 * @param {string} size
	 * @return {Object}
	 */
	imageSize: function( size ) {
		var sizes = this.model.get('sizes'), matched = false;

		size = size || 'medium';

		// Use the provided image size if possible.
		if ( sizes ) {
			if ( sizes[ size ] ) {
				matched = sizes[ size ];
			} else if ( sizes.large ) {
				matched = sizes.large;
			} else if ( sizes.thumbnail ) {
				matched = sizes.thumbnail;
			} else if ( sizes.full ) {
				matched = sizes.full;
			}

			if ( matched ) {
				return _.clone( matched );
			}
		}

		return {
			url:         this.model.get('url'),
			width:       this.model.get('width'),
			height:      this.model.get('height'),
			orientation: this.model.get('orientation')
		};
	},
	/**
	 * @param {Object} event
	 */
	updateSetting: function( event ) {
		var $setting = $( event.target ).closest('[data-setting]'),
			setting, value;

		if ( ! $setting.length ) {
			return;
		}

		setting = $setting.data('setting');
		value   = event.target.value;

		if ( this.model.get( setting ) !== value ) {
			this.save( setting, value );
		}
	},

	/**
	 * Pass all the arguments to the model's save method.
	 *
	 * Records the aggregate status of all save requests and updates the
	 * view's classes accordingly.
	 */
	save: function() {
		var view = this,
			save = this._save = this._save || { status: 'ready' },
			request = this.model.save.apply( this.model, arguments ),
			requests = save.requests ? $.when( request, save.requests ) : request;

		// If we're waiting to remove 'Saved.', stop.
		if ( save.savedTimer ) {
			clearTimeout( save.savedTimer );
		}

		this.updateSave('waiting');
		save.requests = requests;
		requests.always( function() {
			// If we've performed another request since this one, bail.
			if ( save.requests !== requests ) {
				return;
			}

			view.updateSave( requests.state() === 'resolved' ? 'complete' : 'error' );
			save.savedTimer = setTimeout( function() {
				view.updateSave('ready');
				delete save.savedTimer;
			}, 2000 );
		});
	},
	/**
	 * @param {string} status
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	updateSave: function( status ) {
		var save = this._save = this._save || { status: 'ready' };

		if ( status && status !== save.status ) {
			this.$el.removeClass( 'save-' + save.status );
			save.status = status;
		}

		this.$el.addClass( 'save-' + save.status );
		return this;
	},

	updateAll: function() {
		var $settings = this.$('[data-setting]'),
			model = this.model,
			changed;

		changed = _.chain( $settings ).map( function( el ) {
			var $input = $('input, textarea, select, [value]', el ),
				setting, value;

			if ( ! $input.length ) {
				return;
			}

			setting = $(el).data('setting');
			value = $input.val();

			// Record the value if it changed.
			if ( model.get( setting ) !== value ) {
				return [ setting, value ];
			}
		}).compact().object().value();

		if ( ! _.isEmpty( changed ) ) {
			model.save( changed );
		}
	},
	/**
	 * @param {Object} event
	 */
	removeFromLibrary: function( event ) {
		// Catch enter and space events.
		if ( 'keydown' === event.type && 13 !== event.keyCode && 32 !== event.keyCode ) {
			return;
		}

		// Stop propagation so the model isn't selected.
		event.stopPropagation();

		this.collection.remove( this.model );
	},

	/**
	 * Add the model if it isn't in the selection, if it is in the selection,
	 * remove it.
	 *
	 * @param {[type]} event [description]
	 * @return {[type]} [description]
	 */
	checkClickHandler: function ( event ) {
		var selection = this.options.selection;
		if ( ! selection ) {
			return;
		}
		event.stopPropagation();
		if ( selection.where( { id: this.model.get( 'id' ) } ).length ) {
			selection.remove( this.model );
			// Move focus back to the attachment tile (from the check).
			this.$el.focus();
		} else {
			selection.add( this.model );
		}

		// Trigger an action button update.
		this.controller.trigger( 'selection:toggle' );
	}
});

// Ensure settings remain in sync between attachment views.
_.each({
	caption: '_syncCaption',
	title:   '_syncTitle',
	artist:  '_syncArtist',
	album:   '_syncAlbum'
}, function( method, setting ) {
	/**
	 * @function _syncCaption
	 * @memberOf wp.media.view.Attachment
	 * @instance
	 *
	 * @param {Backbone.Model} model
	 * @param {string} value
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	/**
	 * @function _syncTitle
	 * @memberOf wp.media.view.Attachment
	 * @instance
	 *
	 * @param {Backbone.Model} model
	 * @param {string} value
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	/**
	 * @function _syncArtist
	 * @memberOf wp.media.view.Attachment
	 * @instance
	 *
	 * @param {Backbone.Model} model
	 * @param {string} value
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	/**
	 * @function _syncAlbum
	 * @memberOf wp.media.view.Attachment
	 * @instance
	 *
	 * @param {Backbone.Model} model
	 * @param {string} value
	 * @return {wp.media.view.Attachment} Returns itself to allow chaining.
	 */
	Attachment.prototype[ method ] = function( model, value ) {
		var $setting = this.$('[data-setting="' + setting + '"]');

		if ( ! $setting.length ) {
			return this;
		}

		/*
		 * If the updated value is in sync with the value in the DOM, there
		 * is no need to re-render. If we're currently editing the value,
		 * it will automatically be in sync, suppressing the re-render for
		 * the view we're editing, while updating any others.
		 */
		if ( value === $setting.find('input, textarea, select, [value]').val() ) {
			return this;
		}

		return this.render();
	};
});

module.exports = Attachment;


/***/ },

/***/ 6090
(module) {

/* global ClipboardJS */
var Attachment = wp.media.view.Attachment,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	Details,
	__ = wp.i18n.__;

Details = Attachment.extend(/** @lends wp.media.view.Attachment.Details.prototype */{
	tagName:   'div',
	className: 'attachment-details',
	template:  wp.template('attachment-details'),

	/*
	 * Reset all the attributes inherited from Attachment including role=checkbox,
	 * tabindex, etc., as they are inappropriate for this view. See #47458 and [30483] / #30390.
	 */
	attributes: {},

	events: {
		'change [data-setting]':          'updateSetting',
		'change [data-setting] input':    'updateSetting',
		'change [data-setting] select':   'updateSetting',
		'change [data-setting] textarea': 'updateSetting',
		'click .delete-attachment':       'deleteAttachment',
		'click .trash-attachment':        'trashAttachment',
		'click .untrash-attachment':      'untrashAttachment',
		'click .edit-attachment':         'editAttachment',
		'keydown':                        'toggleSelectionHandler'
	},

	/**
	 * Copies the attachment URL to the clipboard.
	 *
	 * @since 5.5.0
	 *
	 * @param {MouseEvent} event A click event.
	 *
	 * @return {void}
	 */
	 copyAttachmentDetailsURLClipboard: function() {
		var clipboard = new ClipboardJS( '.copy-attachment-url' ),
			successTimeout;

		clipboard.on( 'success', function( event ) {
			var triggerElement = $( event.trigger ),
				successElement = $( '.success', triggerElement.closest( '.copy-to-clipboard-container' ) );

			// Clear the selection and move focus back to the trigger.
			event.clearSelection();

			// Show success visual feedback.
			clearTimeout( successTimeout );
			successElement.removeClass( 'hidden' );

			// Hide success visual feedback after 3 seconds since last success.
			successTimeout = setTimeout( function() {
				successElement.addClass( 'hidden' );
			}, 3000 );

			// Handle success audible feedback.
			wp.a11y.speak( __( 'The file URL has been copied to your clipboard' ) );
		} );
	 },

	/**
	 * Shows the details of an attachment.
	 *
	 * @since 3.5.0
	 *
	 * @constructs wp.media.view.Attachment.Details
	 * @augments wp.media.view.Attachment
	 *
	 * @return {void}
	 */
	initialize: function() {
		this.options = _.defaults( this.options, {
			rerenderOnModelChange: false
		});

		// Call 'initialize' directly on the parent class.
		Attachment.prototype.initialize.apply( this, arguments );

		this.copyAttachmentDetailsURLClipboard();
	},

	/**
	 * Gets the focusable elements to move focus to.
	 *
	 * @since 5.3.0
	 */
	getFocusableElements: function() {
		var editedAttachment = $( 'li[data-id="' + this.model.id + '"]' );

		this.previousAttachment = editedAttachment.prev();
		this.nextAttachment = editedAttachment.next();
	},

	/**
	 * Moves focus to the previous or next attachment in the grid.
	 * Fallbacks to the upload button or media frame when there are no attachments.
	 *
	 * @since 5.3.0
	 */
	moveFocus: function() {
		if ( this.previousAttachment.length ) {
			this.previousAttachment.trigger( 'focus' );
			return;
		}

		if ( this.nextAttachment.length ) {
			this.nextAttachment.trigger( 'focus' );
			return;
		}

		// Fallback: move focus to the "Select Files" button in the media modal.
		if ( this.controller.uploader && this.controller.uploader.$browser ) {
			this.controller.uploader.$browser.trigger( 'focus' );
			return;
		}

		// Last fallback.
		this.moveFocusToLastFallback();
	},

	/**
	 * Moves focus to the media frame as last fallback.
	 *
	 * @since 5.3.0
	 */
	moveFocusToLastFallback: function() {
		// Last fallback: make the frame focusable and move focus to it.
		$( '.media-frame' )
			.attr( 'tabindex', '-1' )
			.trigger( 'focus' );
	},

	/**
	 * Deletes an attachment.
	 *
	 * Deletes an attachment after asking for confirmation. After deletion,
	 * keeps focus in the modal.
	 *
	 * @since 3.5.0
	 *
	 * @param {MouseEvent} event A click event.
	 *
	 * @return {void}
	 */
	deleteAttachment: function( event ) {
		event.preventDefault();

		this.getFocusableElements();

		if ( window.confirm( l10n.warnDelete ) ) {
			this.model.destroy( {
				wait: true,
				error: function() {
					window.alert( l10n.errorDeleting );
				}
			} );

			this.moveFocus();
		}
	},

	/**
	 * Sets the Trash state on an attachment, or destroys the model itself.
	 *
	 * If the mediaTrash setting is set to true, trashes the attachment.
	 * Otherwise, the model itself is destroyed.
	 *
	 * @since 3.9.0
	 *
	 * @param {MouseEvent} event A click event.
	 *
	 * @return {void}
	 */
	trashAttachment: function( event ) {
		var library = this.controller.library,
			self = this;
		event.preventDefault();

		this.getFocusableElements();

		// When in the Media Library and the Media Trash is enabled.
		if ( wp.media.view.settings.mediaTrash &&
			'edit-metadata' === this.controller.content.mode() ) {

			this.model.set( 'status', 'trash' );
			this.model.save().done( function() {
				library._requery( true );
				/*
				 * @todo We need to move focus back to the previous, next, or first
				 * attachment but the library gets re-queried and refreshed.
				 * Thus, the references to the previous attachments are lost.
				 * We need an alternate method.
				 */
				self.moveFocusToLastFallback();
			} );
		} else {
			this.model.destroy();
			this.moveFocus();
		}
	},

	/**
	 * Untrashes an attachment.
	 *
	 * @since 4.0.0
	 *
	 * @param {MouseEvent} event A click event.
	 *
	 * @return {void}
	 */
	untrashAttachment: function( event ) {
		var library = this.controller.library;
		event.preventDefault();

		this.model.set( 'status', 'inherit' );
		this.model.save().done( function() {
			library._requery( true );
		} );
	},

	/**
	 * Opens the edit page for a specific attachment.
	 *
	 * @since 3.5.0
	 *
	 * @param {MouseEvent} event A click event.
	 *
	 * @return {void}
	 */
	editAttachment: function( event ) {
		var editState = this.controller.states.get( 'edit-image' );
		if ( window.imageEdit && editState ) {
			event.preventDefault();

			editState.set( 'image', this.model );
			this.controller.setState( 'edit-image' );
		} else {
			this.$el.addClass('needs-refresh');
		}
	},

	/**
	 * Triggers an event on the controller when reverse tabbing (shift+tab).
	 *
	 * This event can be used to make sure to move the focus correctly.
	 *
	 * @since 4.0.0
	 *
	 * @fires wp.media.controller.MediaLibrary#attachment:details:shift-tab
	 * @fires wp.media.controller.MediaLibrary#attachment:keydown:arrow
	 *
	 * @param {KeyboardEvent} event A keyboard event.
	 *
	 * @return {boolean|void} Returns false or undefined.
	 */
	toggleSelectionHandler: function( event ) {
		if ( 'keydown' === event.type && 9 === event.keyCode && event.shiftKey && event.target === this.$( ':tabbable' ).get( 0 ) ) {
			this.controller.trigger( 'attachment:details:shift-tab', event );
			return false;
		}
	},

	render: function() {
		Attachment.prototype.render.apply( this, arguments );

		wp.media.mixin.removeAllPlayers();
		this.$( 'audio, video' ).each( function (i, elem) {
			var el = wp.media.view.MediaDetails.prepareSrc( elem );
			new window.MediaElementPlayer( el, wp.media.mixin.mejsSettings );
		} );
	}
});

module.exports = Details;


/***/ },

/***/ 5232
(module) {

/**
 * wp.media.view.Attachment.EditLibrary
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditLibrary = wp.media.view.Attachment.extend(/** @lends wp.media.view.Attachment.EditLibrary.prototype */{
	buttons: {
		close: true
	}
});

module.exports = EditLibrary;


/***/ },

/***/ 4593
(module) {

/**
 * wp.media.view.Attachment.EditSelection
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment.Selection
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var EditSelection = wp.media.view.Attachment.Selection.extend(/** @lends wp.media.view.Attachment.EditSelection.prototype */{
	buttons: {
		close: true
	}
});

module.exports = EditSelection;


/***/ },

/***/ 3443
(module) {

/**
 * wp.media.view.Attachment.Library
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Library = wp.media.view.Attachment.extend(/** @lends wp.media.view.Attachment.Library.prototype */{
	buttons: {
		check: true
	}
});

module.exports = Library;


/***/ },

/***/ 3962
(module) {

/**
 * wp.media.view.Attachment.Selection
 *
 * @memberOf wp.media.view.Attachment
 *
 * @class
 * @augments wp.media.view.Attachment
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Selection = wp.media.view.Attachment.extend(/** @lends wp.media.view.Attachment.Selection.prototype */{
	className: 'attachment selection',

	// On click, just select the model, instead of removing the model from
	// the selection.
	toggleSelection: function() {
		this.options.selection.single( this.model );
	}
});

module.exports = Selection;


/***/ },

/***/ 8142
(module) {

var View = wp.media.View,
	$ = jQuery,
	Attachments,
	infiniteScrolling = wp.media.view.settings.infiniteScrolling;

Attachments = View.extend(/** @lends wp.media.view.Attachments.prototype */{
	tagName:   'ul',
	className: 'attachments',

	attributes: {
		tabIndex: -1
	},

	/**
	 * Represents the overview of attachments in the Media Library.
	 *
	 * The constructor binds events to the collection this view represents when
	 * adding or removing attachments or resetting the entire collection.
	 *
	 * @since 3.5.0
	 *
	 * @constructs
	 * @memberof wp.media.view
	 *
	 * @augments wp.media.View
	 *
	 * @listens collection:add
	 * @listens collection:remove
	 * @listens collection:reset
	 * @listens controller:library:selection:add
	 * @listens scrollElement:scroll
	 * @listens this:ready
	 * @listens controller:open
	 */
	initialize: function() {
		this.el.id = _.uniqueId('__attachments-view-');

		/**
		 * @since 5.8.0 Added the `infiniteScrolling` parameter.
		 *
		 * @param infiniteScrolling  Whether to enable infinite scrolling or use
		 *                           the default "load more" button.
		 * @param refreshSensitivity The time in milliseconds to throttle the scroll
		 *                           handler.
		 * @param refreshThreshold   The amount of pixels that should be scrolled before
		 *                           loading more attachments from the server.
		 * @param AttachmentView     The view class to be used for models in the
		 *                           collection.
		 * @param sortable           A jQuery sortable options object
		 *                           ( http://api.jqueryui.com/sortable/ ).
		 * @param resize             A boolean indicating whether or not to listen to
		 *                           resize events.
		 * @param idealColumnWidth   The width in pixels which a column should have when
		 *                           calculating the total number of columns.
		 */
		_.defaults( this.options, {
			infiniteScrolling:  infiniteScrolling || false,
			refreshSensitivity: wp.media.isTouchDevice ? 300 : 200,
			refreshThreshold:   3,
			AttachmentView:     wp.media.view.Attachment,
			sortable:           false,
			resize:             true,
			idealColumnWidth:   $( window ).width() < 640 ? 135 : 150
		});

		this._viewsByCid = {};
		this.$window = $( window );
		this.resizeEvent = 'resize.media-modal-columns';

		this.collection.on( 'add', function( attachment ) {
			this.views.add( this.createAttachmentView( attachment ), {
				at: this.collection.indexOf( attachment )
			});
		}, this );

		/*
		 * Find the view to be removed, delete it and call the remove function to clear
		 * any set event handlers.
		 */
		this.collection.on( 'remove', function( attachment ) {
			var view = this._viewsByCid[ attachment.cid ];
			delete this._viewsByCid[ attachment.cid ];

			if ( view ) {
				view.remove();
			}
		}, this );

		this.collection.on( 'reset', this.render, this );

		this.controller.on( 'library:selection:add', this.attachmentFocus, this );

		if ( this.options.infiniteScrolling ) {
			// Throttle the scroll handler and bind this.
			this.scroll = _.chain( this.scroll ).bind( this ).throttle( this.options.refreshSensitivity ).value();

			this.options.scrollElement = this.options.scrollElement || this.el;
			$( this.options.scrollElement ).on( 'scroll', this.scroll );
		}

		this.initSortable();

		_.bindAll( this, 'setColumns' );

		if ( this.options.resize ) {
			this.on( 'ready', this.bindEvents );
			this.controller.on( 'open', this.setColumns );

			/*
			 * Call this.setColumns() after this view has been rendered in the
			 * DOM so attachments get proper width applied.
			 */
			_.defer( this.setColumns, this );
		}
	},

	/**
	 * Listens to the resizeEvent on the window.
	 *
	 * Adjusts the amount of columns accordingly. First removes any existing event
	 * handlers to prevent duplicate listeners.
	 *
	 * @since 4.0.0
	 *
	 * @listens window:resize
	 *
	 * @return {void}
	 */
	bindEvents: function() {
		this.$window.off( this.resizeEvent ).on( this.resizeEvent, _.debounce( this.setColumns, 50 ) );
	},

	/**
	 * Focuses the first item in the collection.
	 *
	 * @since 4.0.0
	 *
	 * @return {void}
	 */
	attachmentFocus: function() {
		/*
		 * @todo When uploading new attachments, this tries to move focus to
		 * the attachments grid. Actually, a progress bar gets initially displayed
		 * and then updated when uploading completes, so focus is lost.
		 * Additionally: this view is used for both the attachments list and
		 * the list of selected attachments in the bottom media toolbar. Thus, when
		 * uploading attachments, it is called twice and returns two different `this`.
		 * `this.columns` is truthy within the modal.
		 */
		if ( this.columns ) {
			// Move focus to the grid list within the modal.
			this.$el.focus();
		}
	},

	/**
	 * Restores focus to the selected item in the collection.
	 *
	 * Moves focus back to the first selected attachment in the grid. Used when
	 * tabbing backwards from the attachment details sidebar.
	 * See media.view.AttachmentsBrowser.
	 *
	 * @since 4.0.0
	 *
	 * @return {void}
	 */
	restoreFocus: function() {
		this.$( 'li.selected:first' ).focus();
	},

	/**
	 * Handles events for arrow key presses.
	 *
	 * Focuses the attachment in the direction of the used arrow key if it exists.
	 *
	 * @since 4.0.0
	 *
	 * @param {KeyboardEvent} event The keyboard event that triggered this function.
	 *
	 * @return {void}
	 */
	arrowEvent: function( event ) {
		var attachments = this.$el.children( 'li' ),
			perRow = this.columns,
			index = attachments.filter( ':focus' ).index(),
			row = ( index + 1 ) <= perRow ? 1 : Math.ceil( ( index + 1 ) / perRow );

		if ( index === -1 ) {
			return;
		}

		// Left arrow = 37.
		if ( 37 === event.keyCode ) {
			if ( 0 === index ) {
				return;
			}
			attachments.eq( index - 1 ).focus();
		}

		// Up arrow = 38.
		if ( 38 === event.keyCode ) {
			if ( 1 === row ) {
				return;
			}
			attachments.eq( index - perRow ).focus();
		}

		// Right arrow = 39.
		if ( 39 === event.keyCode ) {
			if ( attachments.length === index ) {
				return;
			}
			attachments.eq( index + 1 ).focus();
		}

		// Down arrow = 40.
		if ( 40 === event.keyCode ) {
			if ( Math.ceil( attachments.length / perRow ) === row ) {
				return;
			}
			attachments.eq( index + perRow ).focus();
		}
	},

	/**
	 * Clears any set event handlers.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	dispose: function() {
		this.collection.props.off( null, null, this );
		if ( this.options.resize ) {
			this.$window.off( this.resizeEvent );
		}

		// Call 'dispose' directly on the parent class.
		View.prototype.dispose.apply( this, arguments );
	},

	/**
	 * Calculates the amount of columns.
	 *
	 * Calculates the amount of columns and sets it on the data-columns attribute
	 * of .media-frame-content.
	 *
	 * @since 4.0.0
	 *
	 * @return {void}
	 */
	setColumns: function() {
		var prev = this.columns,
			width = this.$el.width();

		if ( width ) {
			this.columns = Math.min( Math.round( width / this.options.idealColumnWidth ), 12 ) || 1;

			if ( ! prev || prev !== this.columns ) {
				this.$el.closest( '.media-frame-content' ).attr( 'data-columns', this.columns );
			}
		}
	},

	/**
	 * Initializes jQuery sortable on the attachment list.
	 *
	 * Fails gracefully if jQuery sortable doesn't exist or isn't passed
	 * in the options.
	 *
	 * @since 3.5.0
	 *
	 * @fires collection:reset
	 *
	 * @return {void}
	 */
	initSortable: function() {
		var collection = this.collection;

		if ( ! this.options.sortable || ! $.fn.sortable ) {
			return;
		}

		this.$el.sortable( _.extend({
			// If the `collection` has a `comparator`, disable sorting.
			disabled: !! collection.comparator,

			/*
			 * Change the position of the attachment as soon as the mouse pointer
			 * overlaps a thumbnail.
			 */
			tolerance: 'pointer',

			// Record the initial `index` of the dragged model.
			start: function( event, ui ) {
				ui.item.data('sortableIndexStart', ui.item.index());
			},

			/*
			 * Update the model's index in the collection. Do so silently, as the view
			 * is already accurate.
			 */
			update: function( event, ui ) {
				var model = collection.at( ui.item.data('sortableIndexStart') ),
					comparator = collection.comparator;

				// Temporarily disable the comparator to prevent `add`
				// from re-sorting.
				delete collection.comparator;

				// Silently shift the model to its new index.
				collection.remove( model, {
					silent: true
				});
				collection.add( model, {
					silent: true,
					at:     ui.item.index()
				});

				// Restore the comparator.
				collection.comparator = comparator;

				// Fire the `reset` event to ensure other collections sync.
				collection.trigger( 'reset', collection );

				// If the collection is sorted by menu order, update the menu order.
				collection.saveMenuOrder();
			}
		}, this.options.sortable ) );

		/*
		 * If the `orderby` property is changed on the `collection`,
		 * check to see if we have a `comparator`. If so, disable sorting.
		 */
		collection.props.on( 'change:orderby', function() {
			this.$el.sortable( 'option', 'disabled', !! collection.comparator );
		}, this );

		this.collection.props.on( 'change:orderby', this.refreshSortable, this );
		this.refreshSortable();
	},

	/**
	 * Disables jQuery sortable if collection has a comparator or collection.orderby
	 * equals menuOrder.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	refreshSortable: function() {
		if ( ! this.options.sortable || ! $.fn.sortable ) {
			return;
		}

		var collection = this.collection,
			orderby = collection.props.get('orderby'),
			enabled = 'menuOrder' === orderby || ! collection.comparator;

		this.$el.sortable( 'option', 'disabled', ! enabled );
	},

	/**
	 * Creates a new view for an attachment and adds it to _viewsByCid.
	 *
	 * @since 3.5.0
	 *
	 * @param {wp.media.model.Attachment} attachment
	 *
	 * @return {wp.media.View} The created view.
	 */
	createAttachmentView: function( attachment ) {
		var view = new this.options.AttachmentView({
			controller:           this.controller,
			model:                attachment,
			collection:           this.collection,
			selection:            this.options.selection
		});

		return this._viewsByCid[ attachment.cid ] = view;
	},

	/**
	 * Prepares view for display.
	 *
	 * Creates views for every attachment in collection if the collection is not
	 * empty, otherwise clears all views and loads more attachments.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	prepare: function() {
		if ( this.collection.length ) {
			this.views.set( this.collection.map( this.createAttachmentView, this ) );
		} else {
			this.views.unset();
			if ( this.options.infiniteScrolling ) {
				this.collection.more().done( this.scroll );
			}
		}
	},

	/**
	 * Triggers the scroll function to check if we should query for additional
	 * attachments right away.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	ready: function() {
		if ( this.options.infiniteScrolling ) {
			this.scroll();
		}
	},

	/**
	 * Handles scroll events.
	 *
	 * Shows the spinner if we're close to the bottom. Loads more attachments from
	 * server if we're {refreshThreshold} times away from the bottom.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	scroll: function() {
		var view = this,
			el = this.options.scrollElement,
			scrollTop = el.scrollTop,
			toolbar;

		/*
		 * The scroll event occurs on the document, but the element that should be
		 * checked is the document body.
		 */
		if ( el === document ) {
			el = document.body;
			scrollTop = $(document).scrollTop();
		}

		if ( ! $(el).is(':visible') || ! this.collection.hasMore() ) {
			return;
		}

		toolbar = this.views.parent.toolbar;

		// Show the spinner only if we are close to the bottom.
		if ( el.scrollHeight - ( scrollTop + el.clientHeight ) < el.clientHeight / 3 ) {
			toolbar.get('spinner').show();
		}

		if ( el.scrollHeight < scrollTop + ( el.clientHeight * this.options.refreshThreshold ) ) {
			this.collection.more().done(function() {
				view.scroll();
				toolbar.get('spinner').hide();
			});
		}
	}
});

module.exports = Attachments;


/***/ },

/***/ 6829
(module) {

var View = wp.media.View,
	mediaTrash = wp.media.view.settings.mediaTrash,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	AttachmentsBrowser,
	infiniteScrolling = wp.media.view.settings.infiniteScrolling,
	__ = wp.i18n.__,
	sprintf = wp.i18n.sprintf;

/**
 * wp.media.view.AttachmentsBrowser
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 *
 * @param {object}         [options]               The options hash passed to the view.
 * @param {boolean|string} [options.filters=false] Which filters to show in the browser's toolbar.
 *                                                 Accepts 'uploaded' and 'all'.
 * @param {boolean}        [options.search=true]   Whether to show the search interface in the
 *                                                 browser's toolbar.
 * @param {boolean}        [options.date=true]     Whether to show the date filter in the
 *                                                 browser's toolbar.
 * @param {boolean}        [options.display=false] Whether to show the attachments display settings
 *                                                 view in the sidebar.
 * @param {boolean|string} [options.sidebar=true]  Whether to create a sidebar for the browser.
 *                                                 Accepts true, false, and 'errors'.
 */
AttachmentsBrowser = View.extend(/** @lends wp.media.view.AttachmentsBrowser.prototype */{
	tagName:   'div',
	className: 'attachments-browser',

	initialize: function() {
		_.defaults( this.options, {
			filters: false,
			search:  true,
			date:    true,
			display: false,
			sidebar: true,
			AttachmentView: wp.media.view.Attachment.Library
		});

		this.controller.on( 'toggle:upload:attachment', this.toggleUploader, this );
		this.controller.on( 'edit:selection', this.editSelection );

		// In the Media Library, the sidebar is used to display errors before the attachments grid.
		if ( this.options.sidebar && 'errors' === this.options.sidebar ) {
			this.createSidebar();
		}

		/*
		 * In the grid mode (the Media Library), place the Inline Uploader before
		 * other sections so that the visual order and the DOM order match. This way,
		 * the Inline Uploader in the Media Library is right after the "Add New"
		 * button, see ticket #37188.
		 */
		if ( this.controller.isModeActive( 'grid' ) ) {
			this.createUploader();

			/*
			 * Create a multi-purpose toolbar. Used as main toolbar in the Media Library
			 * and also for other things, for example the "Drag and drop to reorder" and
			 * "Suggested dimensions" info in the media modal.
			 */
			this.createToolbar();
		} else {
			this.createToolbar();
			this.createUploader();
		}

		// Add a heading before the attachments list.
		this.createAttachmentsHeading();

		// Create the attachments wrapper view.
		this.createAttachmentsWrapperView();

		if ( ! infiniteScrolling ) {
			this.$el.addClass( 'has-load-more' );
			this.createLoadMoreView();
		}

		// For accessibility reasons, place the normal sidebar after the attachments, see ticket #36909.
		if ( this.options.sidebar && 'errors' !== this.options.sidebar ) {
			this.createSidebar();
		}

		this.updateContent();

		if ( ! infiniteScrolling ) {
			this.updateLoadMoreView();
		}

		if ( ! this.options.sidebar || 'errors' === this.options.sidebar ) {
			this.$el.addClass( 'hide-sidebar' );

			if ( 'errors' === this.options.sidebar ) {
				this.$el.addClass( 'sidebar-for-errors' );
			}
		}

		this.collection.on( 'add remove reset', this.updateContent, this );

		if ( ! infiniteScrolling ) {
			this.collection.on( 'add remove reset', this.updateLoadMoreView, this );
		}

		// The non-cached or cached attachments query has completed.
		this.collection.on( 'attachments:received', this.announceSearchResults, this );
	},

	/**
	 * Updates the `wp.a11y.speak()` ARIA live region with a message to communicate
	 * the number of search results to screen reader users. This function is
	 * debounced because the collection updates multiple times.
	 *
	 * @since 5.3.0
	 *
	 * @return {void}
	 */
	announceSearchResults: _.debounce( function() {
		var count,
			/* translators: Accessibility text. %d: Number of attachments found in a search. */
			mediaFoundHasMoreResultsMessage = __( 'Number of media items displayed: %d. Click load more for more results.' );

		if ( infiniteScrolling ) {
			/* translators: Accessibility text. %d: Number of attachments found in a search. */
			mediaFoundHasMoreResultsMessage = __( 'Number of media items displayed: %d. Scroll the page for more results.' );
		}

		if ( this.collection.mirroring && this.collection.mirroring.args.s ) {
			count = this.collection.length;

			if ( 0 === count ) {
				wp.a11y.speak( l10n.noMediaTryNewSearch );
				return;
			}

			if ( this.collection.hasMore() ) {
				wp.a11y.speak( mediaFoundHasMoreResultsMessage.replace( '%d', count ) );
				return;
			}

			wp.a11y.speak( l10n.mediaFound.replace( '%d', count ) );
		}
	}, 200 ),

	editSelection: function( modal ) {
		// When editing a selection, move focus to the "Go to library" button.
		modal.$( '.media-button-backToLibrary' ).focus();
	},

	/**
	 * @return {wp.media.view.AttachmentsBrowser} Returns itself to allow chaining.
	 */
	dispose: function() {
		this.options.selection.off( null, null, this );
		View.prototype.dispose.apply( this, arguments );
		return this;
	},

	createToolbar: function() {
		var LibraryViewSwitcher, Filters, toolbarOptions,
			showFilterByType = -1 !== $.inArray( this.options.filters, [ 'uploaded', 'all' ] );

		toolbarOptions = {
			controller: this.controller
		};

		if ( this.controller.isModeActive( 'grid' ) ) {
			toolbarOptions.className = 'media-toolbar wp-filter';
		}

		/**
		* @member {wp.media.view.Toolbar}
		*/
		this.toolbar = new wp.media.view.Toolbar( toolbarOptions );

		this.views.add( this.toolbar );

		this.toolbar.set( 'spinner', new wp.media.view.Spinner({
			priority: -20
		}) );

		if ( showFilterByType || this.options.date ) {
			/*
			 * Create a h2 heading before the select elements that filter attachments.
			 * This heading is visible in the modal and visually hidden in the grid.
			 */
			this.toolbar.set( 'filters-heading', new wp.media.view.Heading( {
				priority:   -100,
				text:       l10n.filterAttachments,
				level:      'h2',
				className:  'media-attachments-filter-heading screen-reader-text'
			}).render() );
		}

		if ( showFilterByType ) {
			// "Filters" is a <select>, a label element needs to be rendered before.
			this.toolbar.set( 'filtersLabel', new wp.media.view.Label({
				value: l10n.filterByType,
				attributes: {
					'for':  'media-attachment-filters'
				},
				priority:   -80
			}).render() );

			if ( 'uploaded' === this.options.filters ) {
				this.toolbar.set( 'filters', new wp.media.view.AttachmentFilters.Uploaded({
					controller: this.controller,
					model:      this.collection.props,
					priority:   -80
				}).render() );
			} else {
				Filters = new wp.media.view.AttachmentFilters.All({
					controller: this.controller,
					model:      this.collection.props,
					priority:   -80
				});

				this.toolbar.set( 'filters', Filters.render() );
			}
		}

		/*
		 * Feels odd to bring the global media library switcher into the Attachment browser view.
		 * Is this a use case for doAction( 'add:toolbar-items:attachments-browser', this.toolbar );
		 * which the controller can tap into and add this view?
		 */
		if ( this.controller.isModeActive( 'grid' ) ) {
			LibraryViewSwitcher = View.extend({
				className: 'view-switch media-grid-view-switch',
				template: wp.template( 'media-library-view-switcher')
			});

			this.toolbar.set( 'libraryViewSwitcher', new LibraryViewSwitcher({
				controller: this.controller,
				priority: -90
			}).render() );

			// DateFilter is a <select>, a label element needs to be rendered before.
			this.toolbar.set( 'dateFilterLabel', new wp.media.view.Label({
				value: l10n.filterByDate,
				attributes: {
					'for': 'media-attachment-date-filters'
				},
				priority: -75
			}).render() );
			this.toolbar.set( 'dateFilter', new wp.media.view.DateFilter({
				controller: this.controller,
				model:      this.collection.props,
				priority:   -75,
			}).render() );

			// BulkSelection is a <div> with subviews, including screen reader text.
			this.toolbar.set( 'selectModeToggleButton', new wp.media.view.SelectModeToggleButton({
				text: l10n.bulkSelect,
				controller: this.controller,
				priority: -70
			}).render() );

			this.toolbar.set( 'deleteSelectedButton', new wp.media.view.DeleteSelectedButton({
				filters: Filters,
				style: 'primary',
				disabled: true,
				text: mediaTrash ? l10n.trashSelected : l10n.deletePermanently,
				controller: this.controller,
				priority: -80,
				click: function() {
					var changed = [], removed = [],
						selection = this.controller.state().get( 'selection' ),
						library = this.controller.state().get( 'library' );

					if ( ! selection.length ) {
						return;
					}

					if ( ! mediaTrash && ! window.confirm( l10n.warnBulkDelete ) ) {
						return;
					}

					if ( mediaTrash &&
						'trash' !== selection.at( 0 ).get( 'status' ) &&
						! window.confirm( l10n.warnBulkTrash ) ) {

						return;
					}

					selection.each( function( model ) {
						if ( ! model.get( 'nonces' )['delete'] ) {
							removed.push( model );
							return;
						}

						if ( mediaTrash && 'trash' === model.get( 'status' ) ) {
							model.set( 'status', 'inherit' );
							changed.push( model.save() );
							removed.push( model );
						} else if ( mediaTrash ) {
							model.set( 'status', 'trash' );
							changed.push( model.save() );
							removed.push( model );
						} else {
							model.destroy({wait: true});
						}
					} );

					if ( changed.length ) {
						selection.remove( removed );

						$.when.apply( null, changed ).then( _.bind( function() {
							library._requery( true );
							this.controller.trigger( 'selection:action:done' );
						}, this ) );
					} else {
						this.controller.trigger( 'selection:action:done' );
					}
				}
			}).render() );

			if ( mediaTrash ) {
				this.toolbar.set( 'deleteSelectedPermanentlyButton', new wp.media.view.DeleteSelectedPermanentlyButton({
					filters: Filters,
					style: 'link button-link-delete',
					disabled: true,
					text: l10n.deletePermanently,
					controller: this.controller,
					priority: -55,
					size: '',
					click: function() {
						var removed = [],
							destroy = [],
							selection = this.controller.state().get( 'selection' );

						if ( ! selection.length || ! window.confirm( l10n.warnBulkDelete ) ) {
							return;
						}

						selection.each( function( model ) {
							if ( ! model.get( 'nonces' )['delete'] ) {
								removed.push( model );
								return;
							}

							destroy.push( model );
						} );

						if ( removed.length ) {
							selection.remove( removed );
						}

						if ( destroy.length ) {
							$.when.apply( null, destroy.map( function (item) {
								return item.destroy();
							} ) ).then( _.bind( function() {
								this.controller.trigger( 'selection:action:done' );
							}, this ) );
						}
					}
				}).render() );
			}

		} else if ( this.options.date ) {
			// DateFilter is a <select>, a label element needs to be rendered before.
			this.toolbar.set( 'dateFilterLabel', new wp.media.view.Label({
				value: l10n.filterByDate,
				attributes: {
					'for': 'media-attachment-date-filters'
				},
				priority: -75
			}).render() );
			this.toolbar.set( 'dateFilter', new wp.media.view.DateFilter({
				controller: this.controller,
				model:      this.collection.props,
				priority:   -75
			}).render() );
		}

		if ( this.options.search ) {
			// Search is an input, a label element needs to be rendered before.
			this.toolbar.set( 'searchLabel', new wp.media.view.Label({
				value: l10n.searchLabel,
				className: 'media-search-input-label',
				attributes: {
					'for': 'media-search-input'
				},
				priority:   60
			}).render() );
			this.toolbar.set( 'search', new wp.media.view.Search({
				controller: this.controller,
				model:      this.collection.props,
				priority:   60
			}).render() );
		}

		if ( this.options.dragInfo ) {
			this.toolbar.set( 'dragInfo', new View({
				el: $( '<div class="instructions">' + l10n.dragInfo + '</div>' )[0],
				priority: -40
			}) );
		}

		if ( this.options.suggestedWidth && this.options.suggestedHeight ) {
			this.toolbar.set( 'suggestedDimensions', new View({
				el: $( '<div class="instructions">' + l10n.suggestedDimensions.replace( '%1$s', this.options.suggestedWidth ).replace( '%2$s', this.options.suggestedHeight ) + '</div>' )[0],
				priority: -40
			}) );
		}
	},

	updateContent: function() {
		var view = this,
			noItemsView;

		if ( this.controller.isModeActive( 'grid' ) ) {
			// Usually the media library.
			noItemsView = view.attachmentsNoResults;
		} else {
			// Usually the media modal.
			noItemsView = view.uploader;
		}

		if ( ! this.collection.length ) {
			this.toolbar.get( 'spinner' ).show();
			this.toolbar.$( '.media-bg-overlay' ).show();
			this.dfd = this.collection.more().done( function() {
				if ( ! view.collection.length ) {
					noItemsView.$el.removeClass( 'hidden' );
				} else {
					noItemsView.$el.addClass( 'hidden' );
				}
				view.toolbar.get( 'spinner' ).hide();
				view.toolbar.$( '.media-bg-overlay' ).hide();
			} );
		} else {
			noItemsView.$el.addClass( 'hidden' );
			view.toolbar.get( 'spinner' ).hide();
			this.toolbar.$( '.media-bg-overlay' ).hide();
		}
	},

	createUploader: function() {
		this.uploader = new wp.media.view.UploaderInline({
			controller: this.controller,
			status:     false,
			message:    this.controller.isModeActive( 'grid' ) ? '' : l10n.noItemsFound,
			canClose:   this.controller.isModeActive( 'grid' )
		});

		this.uploader.$el.addClass( 'hidden' );
		this.views.add( this.uploader );
	},

	toggleUploader: function() {
		if ( this.uploader.$el.hasClass( 'hidden' ) ) {
			this.uploader.show();
		} else {
			this.uploader.hide();
		}
	},

	/**
	 * Creates the Attachments wrapper view.
	 *
	 * @since 5.8.0
	 *
	 * @return {void}
	 */
	createAttachmentsWrapperView: function() {
		this.attachmentsWrapper = new wp.media.View( {
			className: 'attachments-wrapper'
		} );

		// Create the list of attachments.
		this.views.add( this.attachmentsWrapper );
		this.createAttachments();
	},

	createAttachments: function() {
		this.attachments = new wp.media.view.Attachments({
			controller:           this.controller,
			collection:           this.collection,
			selection:            this.options.selection,
			model:                this.model,
			sortable:             this.options.sortable,
			scrollElement:        this.options.scrollElement,
			idealColumnWidth:     this.options.idealColumnWidth,

			// The single `Attachment` view to be used in the `Attachments` view.
			AttachmentView: this.options.AttachmentView
		});

		// Add keydown listener to the instance of the Attachments view.
		this.controller.on( 'attachment:keydown:arrow',     _.bind( this.attachments.arrowEvent, this.attachments ) );
		this.controller.on( 'attachment:details:shift-tab', _.bind( this.attachments.restoreFocus, this.attachments ) );

		this.views.add( '.attachments-wrapper', this.attachments );

		if ( this.controller.isModeActive( 'grid' ) ) {
			this.attachmentsNoResults = new View({
				controller: this.controller,
				tagName: 'p'
			});

			this.attachmentsNoResults.$el.addClass( 'hidden no-media' );
			this.attachmentsNoResults.$el.html( l10n.noMedia );

			this.views.add( this.attachmentsNoResults );
		}
	},

	/**
	 * Creates the load more button and attachments counter view.
	 *
	 * @since 5.8.0
	 *
	 * @return {void}
	 */
	createLoadMoreView: function() {
		var view = this;

		this.loadMoreWrapper = new View( {
			controller: this.controller,
			className: 'load-more-wrapper'
		} );

		this.loadMoreCount = new View( {
			controller: this.controller,
			tagName: 'p',
			className: 'load-more-count hidden'
		} );

		this.loadMoreButton = new wp.media.view.Button( {
			text: __( 'Load more' ),
			className: 'load-more hidden',
			style: 'primary',
			size: '',
			click: function() {
				view.loadMoreAttachments();
			}
		} );

		this.loadMoreSpinner = new wp.media.view.Spinner();

		this.loadMoreJumpToFirst = new wp.media.view.Button( {
			text: __( 'Jump to first loaded item' ),
			className: 'load-more-jump hidden',
			size: '',
			click: function() {
				view.jumpToFirstAddedItem();
			}
		} );

		this.views.add( '.attachments-wrapper', this.loadMoreWrapper );
		this.views.add( '.load-more-wrapper', this.loadMoreSpinner );
		this.views.add( '.load-more-wrapper', this.loadMoreCount );
		this.views.add( '.load-more-wrapper', this.loadMoreButton );
		this.views.add( '.load-more-wrapper', this.loadMoreJumpToFirst );
	},

	/**
	 * Updates the Load More view. This function is debounced because the
	 * collection updates multiple times at the add, remove, and reset events.
	 * We need it to run only once, after all attachments are added or removed.
	 *
	 * @since 5.8.0
	 *
	 * @return {void}
	 */
	updateLoadMoreView: _.debounce( function() {
		// Ensure the load more view elements are initially hidden at each update.
		this.loadMoreButton.$el.addClass( 'hidden' );
		this.loadMoreCount.$el.addClass( 'hidden' );
		this.loadMoreJumpToFirst.$el.addClass( 'hidden' ).prop( 'disabled', true );

		if ( ! this.collection.getTotalAttachments() ) {
			return;
		}

		if ( this.collection.length ) {
			this.loadMoreCount.$el.text(
				/* translators: 1: Number of displayed attachments, 2: Number of total attachments. */
				sprintf(
					__( 'Showing %1$s of %2$s media items' ),
					this.collection.length,
					this.collection.getTotalAttachments()
				)
			);

			this.loadMoreCount.$el.removeClass( 'hidden' );
		}

		/*
		 * Notice that while the collection updates multiple times hasMore() may
		 * return true when it's actually not true.
		 */
		if ( this.collection.hasMore() ) {
			this.loadMoreButton.$el.removeClass( 'hidden' );
		}

		// Find the media item to move focus to. The jQuery `eq()` index is zero-based.
		this.firstAddedMediaItem = this.$el.find( '.attachment' ).eq( this.firstAddedMediaItemIndex );

		// If there's a media item to move focus to, make the "Jump to" button available.
		if ( this.firstAddedMediaItem.length ) {
			this.firstAddedMediaItem.addClass( 'new-media' );
			this.loadMoreJumpToFirst.$el.removeClass( 'hidden' ).prop( 'disabled', false );
		}

		// If there are new items added, but no more to be added, move focus to Jump button.
		if ( this.firstAddedMediaItem.length && ! this.collection.hasMore() ) {
			this.loadMoreJumpToFirst.$el.trigger( 'focus' );
		}
	}, 10 ),

	/**
	 * Loads more attachments.
	 *
	 * @since 5.8.0
	 *
	 * @return {void}
	 */
	loadMoreAttachments: function() {
		var view = this;

		if ( ! this.collection.hasMore() ) {
			return;
		}

		/*
		 * The collection index is zero-based while the length counts the actual
		 * amount of items. Thus the length is equivalent to the position of the
		 * first added item.
		 */
		this.firstAddedMediaItemIndex = this.collection.length;

		this.$el.addClass( 'more-loaded' );
		this.collection.each( function( attachment ) {
			var attach_id = attachment.attributes.id;
			$( '[data-id="' + attach_id + '"]' ).addClass( 'found-media' );
		});

		view.loadMoreSpinner.show();
		this.collection.once( 'attachments:received', function() {
			view.loadMoreSpinner.hide();
		} );
		this.collection.more();
	},

	/**
	 * Moves focus to the first new added item.	.
	 *
	 * @since 5.8.0
	 *
	 * @return {void}
	 */
	jumpToFirstAddedItem: function() {
		// Set focus on first added item.
		this.firstAddedMediaItem.focus();
	},

	createAttachmentsHeading: function() {
		this.attachmentsHeading = new wp.media.view.Heading( {
			text: l10n.attachmentsList,
			level: 'h2',
			className: 'media-views-heading screen-reader-text'
		} );
		this.views.add( this.attachmentsHeading );
	},

	createSidebar: function() {
		var options = this.options,
			selection = options.selection,
			sidebar = this.sidebar = new wp.media.view.Sidebar({
				controller: this.controller
			});

		this.views.add( sidebar );

		if ( this.controller.uploader ) {
			sidebar.set( 'uploads', new wp.media.view.UploaderStatus({
				controller: this.controller,
				priority:   40
			}) );
		}

		selection.on( 'selection:single', this.createSingle, this );
		selection.on( 'selection:unsingle', this.disposeSingle, this );

		if ( selection.single() ) {
			this.createSingle();
		}
	},

	createSingle: function() {
		var sidebar = this.sidebar,
			single = this.options.selection.single();

		sidebar.set( 'details', new wp.media.view.Attachment.Details({
			controller: this.controller,
			model:      single,
			priority:   80
		}) );

		sidebar.set( 'compat', new wp.media.view.AttachmentCompat({
			controller: this.controller,
			model:      single,
			priority:   120
		}) );

		if ( this.options.display ) {
			sidebar.set( 'display', new wp.media.view.Settings.AttachmentDisplay({
				controller:   this.controller,
				model:        this.model.display( single ),
				attachment:   single,
				priority:     160,
				userSettings: this.model.get('displayUserSettings')
			}) );
		}

		// Show the sidebar on mobile.
		if ( this.model.id === 'insert' ) {
			sidebar.$el.addClass( 'visible' );
		}
	},

	disposeSingle: function() {
		var sidebar = this.sidebar;
		sidebar.unset('details');
		sidebar.unset('compat');
		sidebar.unset('display');
		// Hide the sidebar on mobile.
		sidebar.$el.removeClass( 'visible' );
	}
});

module.exports = AttachmentsBrowser;


/***/ },

/***/ 3479
(module) {

var Attachments = wp.media.view.Attachments,
	Selection;

/**
 * wp.media.view.Attachments.Selection
 *
 * @memberOf wp.media.view.Attachments
 *
 * @class
 * @augments wp.media.view.Attachments
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Selection = Attachments.extend(/** @lends wp.media.view.Attachments.Selection.prototype */{
	events: {},
	initialize: function() {
		_.defaults( this.options, {
			sortable:   false,
			resize:     false,

			// The single `Attachment` view to be used in the `Attachments` view.
			AttachmentView: wp.media.view.Attachment.Selection
		});
		// Call 'initialize' directly on the parent class.
		return Attachments.prototype.initialize.apply( this, arguments );
	}
});

module.exports = Selection;


/***/ },

/***/ 168
(module) {

var $ = Backbone.$,
	ButtonGroup;

/**
 * wp.media.view.ButtonGroup
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
ButtonGroup = wp.media.View.extend(/** @lends wp.media.view.ButtonGroup.prototype */{
	tagName:   'div',
	className: 'button-group button-large media-button-group',

	initialize: function() {
		/**
		 * @member {wp.media.view.Button[]}
		 */
		this.buttons = _.map( this.options.buttons || [], function( button ) {
			if ( button instanceof Backbone.View ) {
				return button;
			} else {
				return new wp.media.view.Button( button ).render();
			}
		});

		delete this.options.buttons;

		if ( this.options.classes ) {
			this.$el.addClass( this.options.classes );
		}
	},

	/**
	 * @return {wp.media.view.ButtonGroup}
	 */
	render: function() {
		this.$el.html( $( _.pluck( this.buttons, 'el' ) ).detach() );
		return this;
	}
});

module.exports = ButtonGroup;


/***/ },

/***/ 846
(module) {

/**
 * wp.media.view.Button
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Button = wp.media.View.extend(/** @lends wp.media.view.Button.prototype */{
	tagName:    'button',
	className:  'media-button',
	attributes: { type: 'button' },

	events: {
		'click': 'click'
	},

	defaults: {
		text:     '',
		style:    '',
		size:     'large',
		disabled: false
	},

	initialize: function() {
		/**
		 * Create a model with the provided `defaults`.
		 *
		 * @member {Backbone.Model}
		 */
		this.model = new Backbone.Model( this.defaults );

		// If any of the `options` have a key from `defaults`, apply its
		// value to the `model` and remove it from the `options` object.
		_.each( this.defaults, function( def, key ) {
			var value = this.options[ key ];
			if ( _.isUndefined( value ) ) {
				return;
			}

			this.model.set( key, value );
			delete this.options[ key ];
		}, this );

		this.listenTo( this.model, 'change', this.render );
	},
	/**
	 * @return {wp.media.view.Button} Returns itself to allow chaining.
	 */
	render: function() {
		var classes = [ 'button', this.className ],
			model = this.model.toJSON();

		if ( model.style ) {
			classes.push( 'button-' + model.style );
		}

		if ( model.size ) {
			classes.push( 'button-' + model.size );
		}

		classes = _.uniq( classes.concat( this.options.classes ) );
		this.el.className = classes.join(' ');

		this.$el.prop( 'disabled', model.disabled );
		this.$el.text( this.model.get('text') );

		return this;
	},
	/**
	 * @param {Object} event
	 */
	click: function( event ) {
		if ( '#' === this.attributes.href ) {
			event.preventDefault();
		}

		if ( this.options.click && ! this.model.get('disabled') ) {
			this.options.click.apply( this, arguments );
		}
	}
});

module.exports = Button;


/***/ },

/***/ 7637
(module) {

var View = wp.media.View,
	UploaderStatus = wp.media.view.UploaderStatus,
	l10n = wp.media.view.l10n,
	$ = jQuery,
	Cropper;

/**
 * wp.media.view.Cropper
 *
 * Uses the imgAreaSelect plugin to allow a user to crop an image.
 *
 * Takes imgAreaSelect options from
 * wp.customize.HeaderControl.calculateImageSelectOptions via
 * wp.customize.HeaderControl.openMM.
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
Cropper = View.extend(/** @lends wp.media.view.Cropper.prototype */{
	className: 'crop-content',
	template: wp.template('crop-content'),
	initialize: function() {
		_.bindAll(this, 'onImageLoad');
	},
	ready: function() {
		this.controller.frame.on('content:error:crop', this.onError, this);
		this.$image = this.$el.find('.crop-image');
		this.$image.on('load', this.onImageLoad);
		$(window).on('resize.cropper', _.debounce(this.onImageLoad, 250));
	},
	remove: function() {
		$(window).off('resize.cropper');
		this.$el.remove();
		this.$el.off();
		View.prototype.remove.apply(this, arguments);
	},
	prepare: function() {
		return {
			title: l10n.cropYourImage,
			url: this.options.attachment.get('url')
		};
	},
	onImageLoad: function() {
		var imgOptions = this.controller.get('imgSelectOptions'),
			imgSelect;

		if (typeof imgOptions === 'function') {
			imgOptions = imgOptions(this.options.attachment, this.controller);
		}

		imgOptions = _.extend(imgOptions, {
			parent: this.$el,
			onInit: function() {

				// Store the set ratio.
				var setRatio = imgSelect.getOptions().aspectRatio;

				// On mousedown, if no ratio is set and the Shift key is down, use a 1:1 ratio.
				this.parent.children().on( 'mousedown touchstart', function( e ) {

					// If no ratio is set and the shift key is down, use a 1:1 ratio.
					if ( ! setRatio && e.shiftKey ) {
						imgSelect.setOptions( {
							aspectRatio: '1:1'
						} );
					}
				} );

				this.parent.children().on( 'mouseup touchend', function() {

					// Restore the set ratio.
					imgSelect.setOptions( {
						aspectRatio: setRatio ? setRatio : false
					} );
				} );
			}
		} );
		this.trigger('image-loaded');
		imgSelect = this.controller.imgSelect = this.$image.imgAreaSelect(imgOptions);
	},
	onError: function() {
		var filename = this.options.attachment.get('filename');

		this.views.add( '.upload-errors', new wp.media.view.UploaderStatusError({
			filename: UploaderStatus.prototype.filename(filename),
			message: window._wpMediaViewsL10n.cropError
		}), { at: 0 });
	}
});

module.exports = Cropper;


/***/ },

/***/ 6126
(module) {

var View = wp.media.View,
	EditImage;

/**
 * wp.media.view.EditImage
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
EditImage = View.extend(/** @lends wp.media.view.EditImage.prototype */{
	className: 'image-editor',
	template: wp.template('image-editor'),

	initialize: function( options ) {
		this.editor = window.imageEdit;
		this.controller = options.controller;
		View.prototype.initialize.apply( this, arguments );
	},

	prepare: function() {
		return this.model.toJSON();
	},

	loadEditor: function() {
		this.editor.open( this.model.get( 'id' ), this.model.get( 'nonces' ).edit, this );
	},

	back: function() {
		var lastState = this.controller.lastState();
		this.controller.setState( lastState );
	},

	refresh: function() {
		this.model.fetch();
	},

	save: function() {
		var lastState = this.controller.lastState();

		this.model.fetch().done( _.bind( function() {
			this.controller.setState( lastState );
		}, this ) );
	}

});

module.exports = EditImage;


/***/ },

/***/ 5741
(module) {

/**
 * wp.media.view.Embed
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var Embed = wp.media.View.extend(/** @lends wp.media.view.Ember.prototype */{
	className: 'media-embed',

	initialize: function() {
		/**
		 * @member {wp.media.view.EmbedUrl}
		 */
		this.url = new wp.media.view.EmbedUrl({
			controller: this.controller,
			model:      this.model.props
		}).render();

		this.views.set([ this.url ]);
		this.refresh();
		this.listenTo( this.model, 'change:type', this.refresh );
		this.listenTo( this.model, 'change:loading', this.loading );
	},

	/**
	 * @param {Object} view
	 */
	settings: function( view ) {
		if ( this._settings ) {
			this._settings.remove();
		}
		this._settings = view;
		this.views.add( view );
	},

	refresh: function() {
		var type = this.model.get('type'),
			constructor;

		if ( 'image' === type ) {
			constructor = wp.media.view.EmbedImage;
		} else if ( 'link' === type ) {
			constructor = wp.media.view.EmbedLink;
		} else {
			return;
		}

		this.settings( new constructor({
			controller: this.controller,
			model:      this.model.props,
			priority:   40
		}) );
	},

	loading: function() {
		this.$el.toggleClass( 'embed-loading', this.model.get('loading') );
	}
});

module.exports = Embed;


/***/ },

/***/ 2395
(module) {

var AttachmentDisplay = wp.media.view.Settings.AttachmentDisplay,
	EmbedImage;

/**
 * wp.media.view.EmbedImage
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.view.Settings.AttachmentDisplay
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
EmbedImage = AttachmentDisplay.extend(/** @lends wp.media.view.EmbedImage.prototype */{
	className: 'embed-media-settings',
	template:  wp.template('embed-image-settings'),

	initialize: function() {
		/**
		 * Call `initialize` directly on parent class with passed arguments
		 */
		AttachmentDisplay.prototype.initialize.apply( this, arguments );
		this.listenTo( this.model, 'change:url', this.updateImage );
	},

	updateImage: function() {
		this.$('img').attr( 'src', this.model.get('url') );
	}
});

module.exports = EmbedImage;


/***/ },

/***/ 8232
(module) {

var $ = jQuery,
	EmbedLink;

/**
 * wp.media.view.EmbedLink
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.view.Settings
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
EmbedLink = wp.media.view.Settings.extend(/** @lends wp.media.view.EmbedLink.prototype */{
	className: 'embed-link-settings',
	template:  wp.template('embed-link-settings'),

	initialize: function() {
		this.listenTo( this.model, 'change:url', this.updateoEmbed );
	},

	updateoEmbed: _.debounce( function() {
		var url = this.model.get( 'url' );

		// Clear out previous results.
		this.$('.embed-container').hide().find('.embed-preview').empty();
		this.$( '.setting' ).hide();

		// Only proceed with embed if the field contains more than 11 characters.
		// Example: http://a.io is 11 chars
		if ( url && ( url.length < 11 || ! url.match(/^http(s)?:\/\//) ) ) {
			return;
		}

		this.fetch();
	}, wp.media.controller.Embed.sensitivity ),

	fetch: function() {
		var url = this.model.get( 'url' ), re, youTubeEmbedMatch;

		// Check if they haven't typed in 500 ms.
		if ( $('#embed-url-field').val() !== url ) {
			return;
		}

		if ( this.dfd && 'pending' === this.dfd.state() ) {
			this.dfd.abort();
		}

		// Support YouTube embed urls, since they work once in the editor.
		re = /https?:\/\/www\.youtube\.com\/embed\/([^/]+)/;
		youTubeEmbedMatch = re.exec( url );
		if ( youTubeEmbedMatch ) {
			url = 'https://www.youtube.com/watch?v=' + youTubeEmbedMatch[ 1 ];
		}

		this.dfd = wp.apiRequest({
			url: wp.media.view.settings.oEmbedProxyUrl,
			data: {
				url: url,
				maxwidth: this.model.get( 'width' ),
				maxheight: this.model.get( 'height' )
			},
			type: 'GET',
			dataType: 'json',
			context: this
		})
			.done( function( response ) {
				this.renderoEmbed( {
					data: {
						body: response.html || ''
					}
				} );
			} )
			.fail( this.renderFail );
	},

	renderFail: function ( response, status ) {
		if ( 'abort' === status ) {
			return;
		}
		this.$( '.link-text' ).show();
	},

	renderoEmbed: function( response ) {
		var html = ( response && response.data && response.data.body ) || '';

		if ( html ) {
			this.$('.embed-container').show().find('.embed-preview').html( html );
		} else {
			this.renderFail();
		}
	}
});

module.exports = EmbedLink;


/***/ },

/***/ 7327
(module) {

var View = wp.media.View,
	$ = jQuery,
	l10n = wp.media.view.l10n,
	EmbedUrl;

/**
 * wp.media.view.EmbedUrl
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
EmbedUrl = View.extend(/** @lends wp.media.view.EmbedUrl.prototype */{
	tagName:   'span',
	className: 'embed-url',

	events: {
		'input': 'url'
	},

	initialize: function() {
		this.$input = $( '<input id="embed-url-field" type="url" />' )
			.attr( 'aria-label', l10n.insertFromUrlTitle )
			.val( this.model.get('url') );
		this.input = this.$input[0];

		this.spinner = $('<span class="spinner" />')[0];
		this.$el.append([ this.input, this.spinner ]);

		this.listenTo( this.model, 'change:url', this.render );

		if ( this.model.get( 'url' ) ) {
			_.delay( _.bind( function () {
				this.model.trigger( 'change:url' );
			}, this ), 500 );
		}
	},
	/**
	 * @return {wp.media.view.EmbedUrl} Returns itself to allow chaining.
	 */
	render: function() {
		var $input = this.$input;

		if ( $input.is(':focus') ) {
			return;
		}

		if ( this.model.get( 'url' ) ) {
			this.input.value = this.model.get('url');
		} else {
			this.input.setAttribute( 'placeholder', 'https://' );
		}

		/**
		 * Call `render` directly on parent class with passed arguments
		 */
		View.prototype.render.apply( this, arguments );
		return this;
	},

	url: function( event ) {
		var url = event.target.value || '';
		this.model.set( 'url', url.trim() );
	}
});

module.exports = EmbedUrl;


/***/ },

/***/ 718
(module) {

var $ = jQuery;

/**
 * wp.media.view.FocusManager
 *
 * @memberOf wp.media.view
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 */
var FocusManager = wp.media.View.extend(/** @lends wp.media.view.FocusManager.prototype */{

	events: {
		'keydown': 'focusManagementMode'
	},

	/**
	 * Initializes the Focus Manager.
	 *
	 * @param {Object} options The Focus Manager options.
	 *
	 * @since 5.3.0
	 *
	 * @return {void}
	 */
	initialize: function( options ) {
		this.mode                    = options.mode || 'constrainTabbing';
		this.tabsAutomaticActivation = options.tabsAutomaticActivation || false;
	},

 	/**
	 * Determines which focus management mode to use.
	 *
	 * @since 5.3.0
	 *
	 * @param {Object} event jQuery event object.
	 *
	 * @return {void}
	 */
	focusManagementMode: function( event ) {
		if ( this.mode === 'constrainTabbing' ) {
			this.constrainTabbing( event );
		}

		if ( this.mode === 'tabsNavigation' ) {
			this.tabsNavigation( event );
		}
	},

	/**
	 * Gets all the tabbable elements.
	 *
	 * @since 5.3.0
	 *
	 * @return {Object} A jQuery collection of tabbable elements.
	 */
	getTabbables: function() {
		// Skip the file input added by Plupload.
		return this.$( ':tabbable' ).not( '.moxie-shim input[type="file"]' );
	},

	/**
	 * Moves focus to the modal dialog.
	 *
	 * @since 3.5.0
	 *
	 * @return {void}
	 */
	focus: function() {
		this.$( '.media-modal' ).trigger( 'focus' );
	},

	/**
	 * Constrains navigation with the Tab key within the media view element.
	 *
	 * @since 4.0.0
	 *
	 * @param {Object} event A keydown jQuery event.
	 *
	 * @return {void}
	 */
	constrainTabbing: function( event ) {
		var tabbables;

		// Look for the tab key.
		if ( 9 !== event.keyCode ) {
			return;
		}

		tabbables = this.getTabbables();

		// Keep tab focus within media modal while it's open.
		if ( tabbables.last()[0] === event.target && ! event.shiftKey ) {
			tabbables.first().focus();
			return false;
		} else if ( tabbables.first()[0] === event.target && event.shiftKey ) {
			tabbables.last().focus();
			return false;
		}
	},

	/**
	 * Hides from assistive technologies all the body children.
	 *
	 * Sets an `aria-hidden="true"` attribute on all the body children except
	 * the provided element and other elements that should not be hidden.
	 *
	 * The reason why we use `aria-hidden` is that `aria-modal="true"` is buggy
	 * in Safari 11.1 and support is spotty in other browsers. Also, `aria-modal="true"`
	 * prevents the `wp.a11y.speak()` ARIA live regions to work as they're outside
	 * of the modal dialog and get hidden from assistive technologies.
	 *
	 * @since 5.2.3
	 *
	 * @param {Object} visibleElement The jQuery object representing the element that should not be hidden.
	 *
	 * @return {void}
	 */
	setAriaHiddenOnBodyChildren: function( visibleElement ) {
		var bodyChildren,
			self = this;

		if ( this.isBodyAriaHidden ) {
			return;
		}

		// Get all the body children.
		bodyChildren = document.body.children;

		// Loop through the body children and hide the ones that should be hidden.
		_.each( bodyChildren, function( element ) {
			// Don't hide the modal element.
			if ( element === visibleElement[0] ) {
				return;
			}

			// Determine the body children to hide.
			if ( self.elementShouldBeHidden( element ) ) {
				element.setAttribute( 'aria-hidden', 'true' );
				// Store the hidden elements.
				self.ariaHiddenElements.push( element );
			}
		} );

		this.isBodyAriaHidden = true;
	},

	/**
	 * Unhides from assistive technologies all the body children.
	 *
	 * Makes visible again to assistive technologies all the body children
	 * previously hidden and stored in this.ariaHiddenElements.
	 *
	 * @since 5.2.3
	 *
	 * @return {void}
	 */
	removeAriaHiddenFromBodyChildren: function() {
		_.each( this.ariaHiddenElements, function( element ) {
			element.removeAttribute( 'aria-hidden' );
		} );

		this.ariaHiddenElements = [];
		this.isBodyAriaHidden   = false;
	},

	/**
	 * Determines if the passed element should not be hidden from assistive technologies.
	 *
	 * @since 5.2.3
	 *
	 * @param {Object} element The DOM element that should be checked.
	 *
	 * @return {boolean} Whether the element should not be hidden from assistive technologies.
	 */
	elementShouldBeHidden: function( element ) {
		var role = element.getAttribute( 'role' ),
			liveRegionsRoles = [ 'alert', 'status', 'log', 'marquee', 'timer' ];

		/*
		 * Don't hide scripts, elements that already have `aria-hidden`, and
		 * ARIA live regions.
		 */
		return ! (
			element.tagName === 'SCRIPT' ||
			element.hasAttribute( 'aria-hidden' ) ||
			element.hasAttribute( 'aria-live' ) ||
			liveRegionsRoles.indexOf( role ) !== -1
		);
	},

	/**
	 * Whether the body children are hidden from assistive technologies.
	 *
	 * @since 5.2.3
	 */
	isBodyAriaHidden: false,

	/**
	 * Stores an array of DOM elements that should be hidden from assistive
	 * technologies, for example when the media modal dialog opens.
	 *
	 * @since 5.2.3
	 */
	ariaHiddenElements: [],

	/**
	 * Holds the jQuery collection of ARIA tabs.
	 *
	 * @since 5.3.0
	 */
	tabs: $(),

	/**
	 * Sets up tabs in an ARIA tabbed interface.
	 *
	 * @since 5.3.0
	 *
	 * @param {Object} event jQuery event object.
	 *
	 * @return {void}
	 */
	setupAriaTabs: function() {
		this.tabs = this.$( '[role="tab"]' );

		// Set up initial attributes.
		this.tabs.attr( {
			'aria-selected': 'false',
			tabIndex: '-1'
		} );

		// Set up attributes on the initially active tab.
		this.tabs.filter( '.active' )
			.removeAttr( 'tabindex' )
			.attr( 'aria-selected', 'true' );
	},

	/**
	 * Enables arrows navigation within the ARIA tabbed interface.
	 *
	 * @since 5.3.0
	 *
	 * @param {Object} event jQuery event object.
	 *
	 * @return {void}
	 */
	tabsNavigation: function( event ) {
		var orientation = 'horizontal',
			keys = [ 32, 35, 36, 37, 38, 39, 40 ];

		// Return if not Spacebar, End, Home, or Arrow keys.
		if ( keys.indexOf( event.which ) === -1 ) {
			return;
		}

		// Determine navigation direction.
		if ( this.$el.attr( 'aria-orientation' ) === 'vertical' ) {
			orientation = 'vertical';
		}

		// Make Up and Down arrow keys do nothing with horizontal tabs.
		if ( orientation === 'horizontal' && [ 38, 40 ].indexOf( event.which ) !== -1 ) {
			return;
		}

		// Make Left and Right arrow keys do nothing with vertical tabs.
		if ( orientation === 'vertical' && [ 37, 39 ].indexOf( event.which ) !== -1 ) {
			return;
		}

		this.switchTabs( event, this.tabs );
	},

	/**
	 * Switches tabs in the ARIA tabbed interface.
	 *
	 * @since 5.3.0
	 *
	 * @param {Object} event jQuery event object.
	 *
	 * @return {void}
	 */
	switchTabs: function( event ) {
		var key   = event.which,
			index = this.tabs.index( $( event.target ) ),
			newIndex;

		switch ( key ) {
			// Space bar: Activate current targeted tab.
			case 32: {
				this.activateTab( this.tabs[ index ] );
				break;
			}
			// End key: Activate last tab.
			case 35: {
				event.preventDefault();
				this.activateTab( this.tabs[ this.tabs.length - 1 ] );
				break;
			}
			// Home key: Activate first tab.
			case 36: {
				event.preventDefault();
				this.activateTab( this.tabs[ 0 ] );
				break;
			}
			// Left and up keys: Activate previous tab.
			case 37:
			case 38: {
				event.preventDefault();
				newIndex = ( index - 1 ) < 0 ? this.tabs.length - 1 : index - 1;
				this.activateTab( this.tabs[ newIndex ] );
				break;
			}
			// Right and down keys: Activate next tab.
			case 39:
			case 40: {
				event.preventDefault();
				newIndex = ( index + 1 ) === this.tabs.length ? 0 : index + 1;
				this.activateTab( this.tabs[ newIndex ] );
				break;
			}
		}
	},

	/**
	 * Sets a single tab to be focusable and semantically selected.
	 *
	 * @since 5.3.0
	 *
	 * @param {Object} tab The tab DOM element.
	 *
	 * @return {void}
	 */
	activateTab: function( tab ) {
		if ( ! tab ) {
			return;
		}

		// The tab is a DOM element: no need for jQuery methods.
		tab.focus();

		// Handle automatic activation.
		if ( this.tabsAutomaticActivation ) {
			tab.removeAttribute( 'tabindex' );
			tab.setAttribute( 'aria-selected', 'true' );
			tab.click();

			return;
		}

		// Handle manual activation.
		$( tab ).on( 'click', function() {
			tab.removeAttribute( 'tabindex' );
			tab.setAttribute( 'aria-selected', 'true' );
		} );
 	}
});

module.exports = FocusManager;


/***/ },

/***/ 1061
(module) {

/**
 * wp.media.view.Frame
 *
 * A frame is a composite view consisting of one or more regions and one or more
 * states.
 *
 * @memberOf wp.media.view
 *
 * @see wp.media.controller.State
 * @see wp.media.controller.Region
 *
 * @class
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
var Frame = wp.media.View.extend(/** @lends wp.media.view.Frame.prototype */{
	initialize: function() {
		_.defaults( this.options, {
			mode: [ 'select' ]
		});
		this._createRegions();
		this._createStates();
		this._createModes();
	},

	_createRegions: function() {
		// Clone the regions array.
		this.regions = this.regions ? this.regions.slice() : [];

		// Initialize regions.
		_.each( this.regions, function( region ) {
			this[ region ] = new wp.media.controller.Region({
				view:     this,
				id:       region,
				selector: '.media-frame-' + region
			});
		}, this );
	},
	/**
	 * Create the frame's states.
	 *
	 * @see wp.media.controller.State
	 * @see wp.media.controller.StateMachine
	 *
	 * @fires wp.media.controller.State#ready
	 */
	_createStates: function() {
		// Create the default `states` collection.
		this.states = new Backbone.Collection( null, {
			model: wp.media.controller.State
		});

		// Ensure states have a reference to the frame.
		this.states.on( 'add', function( model ) {
			model.frame = this;
			model.trigger('ready');
		}, this );

		if ( this.options.states ) {
			this.states.add( this.options.states );
		}
	},

	/**
	 * A frame can be in a mode or multiple modes at one time.
	 *
	 * For example, the manage media frame can be in the `Bulk Select` or `Edit` mode.
	 */
	_createModes: function() {
		// Store active "modes" that the frame is in. Unrelated to region modes.
		this.activeModes = new Backbone.Collection();
		this.activeModes.on( 'add remove reset', _.bind( this.triggerModeEvents, this ) );

		_.each( this.options.mode, function( mode ) {
			this.activateMode( mode );
		}, this );
	},
	/**
	 * Reset all states on the frame to their defaults.
	 *
	 * @return {wp.media.view.Frame} Returns itself to allow chaining.
	 */
	reset: function() {
		this.states.invoke( 'trigger', 'reset' );
		return this;
	},
	/**
	 * Map activeMode collection events to the frame.
	 */
	triggerModeEvents: function( model, collection, options ) {
		var collectionEvent,
			modeEventMap = {
				add: 'activate',
				remove: 'deactivate'
			},
			eventToTrigger;
		// Probably a better way to do this.
		_.each( options, function( value, key ) {
			if ( value ) {
				collectionEvent = key;
			}
		} );

		if ( ! _.has( modeEventMap, collectionEvent ) ) {
			return;
		}

		eventToTrigger = model.get('id') + ':' + modeEventMap[collectionEvent];
		this.trigger( eventToTrigger );
	},
	/**
	 * Activate a mode on the frame.
	 *
	 * @param string mode Mode ID.
	 * @return {this} Returns itself to allow chaining.
	 */
	activateMode: function( mode ) {
		// Bail if the mode is already active.
		if ( this.isModeActive( mode ) ) {
			return;
		}
		this.activeModes.add( [ { id: mode } ] );
		// Add a CSS class to the frame so elements can be styled for the mode.
		this.$el.addClass( 'mode-' + mode );

		return this;
	},
	/**
	 * Deactivate a mode on the frame.
	 *
	 * @param string mode Mode ID.
	 * @return {this} Returns itself to allow chaining.
	 */
	deactivateMode: function( mode ) {
		// Bail if the mode isn't active.
		if ( ! this.isModeActive( mode ) ) {
			return this;
		}
		this.activeModes.remove( this.activeModes.where( { id: mode } ) );
		this.$el.removeClass( 'mode-' + mode );
		/**
		 * Frame mode deactivation event.
		 *
		 * @event wp.media.view.Frame#{mode}:deactivate
		 */
		this.trigger( mode + ':deactivate' );

		return this;
	},
	/**
	 * Check if a mode is enabled on the frame.
	 *
	 * @param string mode Mode ID.
	 * @return bool
	 */
	isModeActive: function( mode ) {
		return Boolean( this.activeModes.where( { id: mode } ).length );
	}
});

// Make the `Frame` a `StateMachine`.
_.extend( Frame.prototype, wp.media.controller.StateMachine.prototype );

module.exports = Frame;


/***/ },

/***/ 5424
(module) {

var Select = wp.media.view.MediaFrame.Select,
	l10n = wp.media.view.l10n,
	ImageDetails;

/**
 * wp.media.view.MediaFrame.ImageDetails
 *
 * A media frame for manipulating an image that's already been inserted
 * into a post.
 *
 * @memberOf wp.media.view.MediaFrame
 *
 * @class
 * @augments wp.media.view.MediaFrame.Select
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
ImageDetails = Select.extend(/** @lends wp.media.view.MediaFrame.ImageDetails.prototype */{
	defaults: {
		id:      'image',
		url:     '',
		menu:    'image-details',
		content: 'image-details',
		toolbar: 'image-details',
		type:    'link',
		title:    l10n.imageDetailsTitle,
		priority: 120
	},

	initialize: function( options ) {
		this.image = new wp.media.model.PostImage( options.metadata );
		this.options.selection = new wp.media.model.Selection( this.image.attachment, { multiple: false } );
		Select.prototype.initialize.apply( this, arguments );
	},

	bindHandlers: function() {
		Select.prototype.bindHandlers.apply( this, arguments );
		this.on( 'menu:create:image-details', this.createMenu, this );
		this.on( 'content:create:image-details', this.imageDetailsContent, this );
		this.on( 'content:render:edit-image', this.editImageContent, this );
		this.on( 'toolbar:render:image-details', this.renderImageDetailsToolbar, this );
		// Override the select toolbar.
		this.on( 'toolbar:render:replace', this.renderReplaceImageToolbar, this );
	},

	createStates: function() {
		this.states.add([
			new wp.media.controller.ImageDetails({
				image: this.image,
				editable: false
			}),
			new wp.media.controller.ReplaceImage({
				id: 'replace-image',
				library: wp.media.query( { type: 'image' } ),
				image: this.image,
				multiple:  false,
				title:     l10n.imageReplaceTitle,
				toolbar: 'replace',
				priority:  80,
				displaySettings: true
			}),
			new wp.media.controller.EditImage( {
				image: this.image,
				selection: this.options.selection
			} )
		]);
	},

	imageDetailsContent: function( options ) {
		options.view = new wp.media.view.ImageDetails({
			controller: this,
			model: this.state().image,
			attachment: this.state().image.attachment
		});
	},

	editImageContent: function() {
		var state = this.state(),
			model = state.get('image'),
			view;

		if ( ! model ) {
			return;
		}

		view = new wp.media.view.EditImage( { model: model, controller: this } ).render();

		this.content.set( view );

		// After bringing in the frame, load the actual editor via an Ajax call.
		view.loadEditor();

	},

	renderImageDetailsToolbar: function() {
		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				select: {
					style:    'primary',
					text:     l10n.update,
					priority: 80,

					click: function() {
						var controller = this.controller,
							state = controller.state();

						controller.close();

						// Not sure if we want to use wp.media.string.image which will create a shortcode or
						// perhaps wp.html.string to at least to build the <img />.
						state.trigger( 'update', controller.image.toJSON() );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	},

	renderReplaceImageToolbar: function() {
		var frame = this,
			lastState = frame.lastState(),
			previous = lastState && lastState.id;

		this.toolbar.set( new wp.media.view.Toolbar({
			controller: this,
			items: {
				back: {
					text:     l10n.back,
					priority: 80,
					click:    function() {
						if ( previous ) {
							frame.setState( previous );
						} else {
							frame.close();
						}
					}
				},

				replace: {
					style:    'primary',
					text:     l10n.replace,
					priority: 20,
					requires: { selection: true },

					click: function() {
						var controller = this.controller,
							state = controller.state(),
							selection = state.get( 'selection' ),
							attachment = selection.single();

						controller.close();

						controller.image.changeAttachment( attachment, state.display( attachment ) );

						// Not sure if we want to use wp.media.string.image which will create a shortcode or
						// perhaps wp.html.string to at least to build the <img />.
						state.trigger( 'replace', controller.image.toJSON() );

						// Restore and reset the default state.
						controller.setState( controller.options.state );
						controller.reset();
					}
				}
			}
		}) );
	}

});

module.exports = ImageDetails;


/***/ },

/***/ 4274
(module) {

var Select = wp.media.view.MediaFrame.Select,
	Library = wp.media.controller.Library,
	l10n = wp.media.view.l10n,
	Post;

/**
 * wp.media.view.MediaFrame.Post
 *
 * The frame for manipulating media on the Edit Post page.
 *
 * @memberOf wp.media.view.MediaFrame
 *
 * @class
 * @augments wp.media.view.MediaFrame.Select
 * @augments wp.media.view.MediaFrame
 * @augments wp.media.view.Frame
 * @augments wp.media.View
 * @augments wp.Backbone.View
 * @augments Backbone.View
 * @mixes wp.media.controller.StateMachine
 */
Post = Select.extend(/** @lends wp.media.view.MediaFrame.Post.prototype */{
	initialize: function() {
		this.counts = {
			audio: {
				count: wp.media.view.settings.attachmentCounts.audio,
				state: 'playlist'
			},
			video: {
				count: wp.media.view.settings.attachmentCounts.video,
				state: 'video-playlist'
			}
		};

		_.defaults( this.options, {
			multiple:  true,
			editing:   false,
			state:    'insert',
			metadata:  {}
		});

		// Call 'initialize' directly on the parent class.
		Select.prototype.initialize.apply( this, arguments );
		this.createIframeStates();

	},

	/**
	 * Create the default states.
	 */
	createStates: function() {
		var options = this.options;

		this.states.add([
			// Main states.
			new Library({
				id:         'insert',
				title:      l10n.insertMediaTitle,
				priority:   20,
				toolbar:    'main-insert',
				filterable: 'all',
				library:    wp.media.query( options.library ),
				multiple:   options.multiple ? 'reset' : false,
				editable:   true,

				// If the user isn't allowed to edit fields,
				// can they still edit it locally?
				allowLocalEdits: true,

				// Show the attachment display settings.
				displaySettings: true,
				// Update user settings when users adjust the
				// attachment display settings.
				displayUserSettings: true
			}),

			new Library({
				id:         'gallery',
				title:      l10n.createGalleryTitle,
				priority:   40,
				toolbar:    'main-gallery',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'image'
				}, options.library ) )
			}),

			// Embed states.
			new wp.media.controller.Embed( { metadata: options.metadata } ),

			new wp.media.controller.EditImage( { model: options.editImage } ),

			// Gallery states.
			new wp.media.controller.GalleryEdit({
				library: options.selection,
				editing: options.editing,
				menu:    'gallery'
			}),

			new wp.media.controller.GalleryAdd(),

			new Library({
				id:         'playlist',
				title:      l10n.createPlaylistTitle,
				priority:   60,
				toolbar:    'main-playlist',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'audio'
				}, options.library ) )
			}),

			// Playlist states.
			new wp.media.controller.CollectionEdit({
				type: 'audio',
				collectionType: 'playlist',
				title:          l10n.editPlaylistTitle,
				SettingsView:   wp.media.view.Settings.Playlist,
				library:        options.selection,
				editing:        options.editing,
				menu:           'playlist',
				dragInfoText:   l10n.playlistDragInfo,
				dragInfo:       false
			}),

			new wp.media.controller.CollectionAdd({
				type: 'audio',
				collectionType: 'playlist',
				title: l10n.addToPlaylistTitle
			}),

			new Library({
				id:         'video-playlist',
				title:      l10n.createVideoPlaylistTitle,
				priority:   60,
				toolbar:    'main-video-playlist',
				filterable: 'uploaded',
				multiple:   'add',
				editable:   false,

				library:  wp.media.query( _.defaults({
					type: 'video'
				}, options.library ) )
			}),

			new wp.media.controller.CollectionEdit({
				type: 'video',
				collectionType: 'playlist',
				title:          l10n.editVideoPlaylistTitle,
				SettingsView:   wp.media.view.Settings.Playlist,
				library:        options.selection,
				editing:        options.editing,
				menu:           'video-playlist',
				dragInfoText:   l10n.videoPlaylistDragInfo,
				dragInfo:       false
			}),

			new wp.media.controller.CollectionAdd({
				type: 'video',
				collectionType: 'playlist',
				title: l10n.addToVideoPlaylistTitle
			})
		]);

		if ( wp.media.view.settings.post.featuredImageId ) {
			this.states.add( new wp.media.controller.FeaturedImage() );
		}
	},

	bindHandlers: function() {
		var handlers, checkCounts;

		Select.prototype.bindHandlers.apply( this, arguments );

		this.on( 'activate', this.activate, this );

		// Only bother checking media type counts if one of the counts is zero.
		checkCounts = _.find( this.counts, function( type ) {
			return type.count === 0;
		} );

		if ( typeof checkCounts !== 'undefined' ) {
			this.listenTo( wp.media.model.Attachments.all, 'change:type', this.mediaTypeCounts );
		}

		this.on( 'menu:create:gallery', this.createMenu, this );
		this.on( 'menu:create:playlist', this.createMenu, this );
		this.on( 'menu:create:video-playlist', this.createMenu, this );
		this.on( 'toolbar:create:main-insert', this.createToolbar, this );
		this.on( 'toolbar:create:main-gallery', this.createToolbar, this );
		this.on( 'toolbar:create:main-playlist', this.createToolbar, this );
		this.on( 'toolbar:create:main-video-playlist', this.createToolbar, this );
		this.on( 'toolbar:create:featured-image', this.featuredImageToolbar, this );
		this.on( 'toolbar:create:main-embed', this.mainEmbedToolbar, this );

		handlers = {
			menu: {
				'default': 'mainMenu',
				'gallery': 'galleryMenu',
				'playlist': 'playlistMenu',
				'video-playlist': 'videoPlaylistMenu'
			},

			content: {
				'embed':          'embedContent',
				'edit-image':     'editImageContent',
				'edit-selection': 'editSelectionContent'
			},

			toolbar: {
				'main-insert':      'mainInsertToolbar',
				'main-gallery':     'mainGalleryToolbar',
				'gallery-edit':     'galleryEditToolbar',
				'gallery-add':      'galleryAddToolbar',
				'main-playlist':	'mainPlaylistToolbar',
				'playlist-edit':	'playlistEditToolbar',
				'playlist-add':		'playlistAddToolbar',
				'main-video-playlist': 'mainVideoPlaylistToolbar',
				'video-playlist-edit': 'videoPlaylistEditToolbar',
				'video-playlist-add': 'videoPlaylistAddToolbar'
			}
		};

		_.each( handlers, function( regionHandlers, region ) {
			_.each( regionHandlers, function( callback, handler ) {
				this.on( region + ':render:' + handler, this[ callback ], this );
			}, this );
		}, this );
	},

	activate: function() {
		// Hide menu items for states tied to particular media types if there are no items.
		_.each( this.counts, function( type ) {
			if ( type.count < 1 ) {
				this.menuItemVisibility( type.state, 'hide' );
			}
		}, this );
	},

	mediaTypeCounts: function( model, attr ) {
		if ( typeof this.counts[ attr ] !== 'undefined' && this.counts[ attr ].count < 1 ) {
			this.counts[ attr ].count++;
			this.menuItemVisibility( this.counts[ attr ].state, 'show' );
		}
	},

	// Menus.
	/**
	 * @param {wp.Backbone.View} view
	 */
	mainMenu: function( view ) {
		view.set({
			'library-separator': new wp.media.View({
				className:  'separator',
				priority:   100,
				attributes: {
					role: 'presentation'
				}
			})
		});
	},

	menuItemVisibility: function( state, visibility ) {
		var menu = this.menu.get();
		if ( visibility === 'hide' ) {
			menu.hide( state );
		} else if ( visibility === 'show' ) {
			menu.show( state );
		}
	},
	/**
	 * @param {wp.Backbone.View} view
	 */
	galleryMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelGalleryTitle,
				priority: 20,
				click:    function() {
					if ( previous ) {
						frame.setState( previous );
					} else {
						frame.close();
					}

					// Move focus to the modal after canceling a Gallery.
					this.controller.modal.focusManager.focus();
				}
			},
			separateCancel: new wp.media.View({
				className: 'separator',
				priority: 40
			})
		});
	},

	playlistMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelPlaylistTitle,
				priority: 20,
				click:    function() {
					if ( previous ) {
						frame.setState( previous );
					} else {
						frame.close();
					}

					// Move focus to the modal after canceling an Audio Playlist.
					this.controller.modal.focusManager.focus();
				}
			},
			separateCancel: new wp.media.View({
				className: 'separator',
				priority: 40
			})
		});
	},

	videoPlaylistMenu: function( view ) {
		var lastState = this.lastState(),
			previous = lastState && lastState.id,
			frame = this;

		view.set({
			cancel: {
				text:     l10n.cancelVideoPlaylistTitle,
				priority: 20,
				click:    function() {
					if ( previous ) {
						frame.setState( previous );
					} else {
						frame.close();
					}

					// Move focus to the modal after canceling a Video Playlist.
		