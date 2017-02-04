/* globals FileList, OCA.Files.fileActions, oc_debug */
var odfViewer = {
	isDocuments : false,
	supportedMimesReadOnly: [
	],

	supportedMimesReadWrite: [
		'image/jpg',
		'image/jpeg',
		'image/png',
		'image/bmp',
		'image/gif'
	],

	register : function(response){
		var i,
			mimeReadOnly,
			mimeReadWrite;

		if (response && response.mimes){
			jQuery.each(response.mimes, function(i, mime){
				odfViewer.supportedMimesReadOnly.push(mime);
				odfViewer.supportedMimesReadWrite.push(mime);
			});
		}
		for (i = 0; i < odfViewer.supportedMimesReadOnly.length; ++i) {
			mimeReadOnly = odfViewer.supportedMimesReadOnly[i];
			OCA.Files.fileActions.register(mimeReadOnly, 'View', OC.PERMISSION_READ, '', odfViewer.onView);
			OCA.Files.fileActions.setDefault(mimeReadOnly, 'View');
		}
		for (i = 0; i < odfViewer.supportedMimesReadWrite.length; ++i) {
			mimeReadWrite = odfViewer.supportedMimesReadWrite[i];
			OCA.Files.fileActions.register(
					mimeReadWrite,
					'Edit',
					OC.PERMISSION_UPDATE,
					OC.imagePath('core', 'actions/rename'),
					odfViewer.onEdit,
					t('offigimp', 'Edit')
			);
			OCA.Files.fileActions.setDefault(mimeReadWrite, 'Edit');
		}
	},

	dispatch : function(filename){
		if (odfViewer.supportedMimesReadWrite.indexOf(OCA.Files.fileActions.getCurrentMimeType()) !== -1
			&& OCA.Files.fileActions.getCurrentPermissions() & OC.PERMISSION_UPDATE
		){
			odfViewer.onEdit(filename);
		} else {
			odfViewer.onView(filename);
		}
	},

	onEdit : function(fileName, context){
		var fileId = context.$file.attr('data-id');
		var fileDir = context.dir;

		if (fileDir) {
			window.location = OC.generateUrl('apps/offigimp/index#{file_id}_{dir}', {file_id: fileId, dir: fileDir});
		} else {
			window.location = OC.generateUrl('apps/offigimp/index#{file_id}', {file_id: fileId});
		}
	},

	onView: function(filename, context) {
	    var attachTo = odfViewer.isDocuments ? '#documents-content' : '#controls';

	    FileList.setViewerMode(true);
	},

	onClose: function() {
		FileList.setViewerMode(false);
		$('#loleafletframe').remove();
	},

	registerFilesMenu: function(response) {
		var ooxml = response.doc_format === 'ooxml';

		var docExt, spreadsheetExt, presentationExt;
		var docMime, spreadsheetMime, presentationMime;

		(function(OCA){
			OCA.FilesLOMenu = {
				attach: function(newFileMenu) {
					var self = this;

					newFileMenu.addMenuEntry({
						id: 'add-img',
						displayName: t('offigimp', 'Image'),
						templateName: 'New Image.jpg',
						iconClass: 'icon-filetype-document',
						fileType: 'x-office-document',
						actionHandler: function(filename) {
							self._createDocument(docMime, filename);
						}
					});

				},

				_createDocument: function(mimetype, filename) {
					OCA.Files.Files.isFileNameValid(filename);
					filename = FileList.getUniqueName(filename);

					$.post(
						OC.generateUrl('apps/offigimp/ajax/documents/create'),
						{ mimetype : mimetype, filename: filename, dir: $('#dir').val() },
						function(response){
							if (response && response.status === 'success'){
								FileList.add(response.data, {animate: true, scrollTo: true});
							} else {
								OC.dialogs.alert(response.data.message, t('core', 'Could not create file'));
							}
						}
					);
				}
			};
		})(OCA);

		OC.Plugins.register('OCA.Files.NewFileMenu', OCA.FilesLOMenu);
	}
};

$(document).ready(function() {
	if ( typeof OCA !== 'undefined'
		&& typeof OCA.Files !== 'undefined'
		&& typeof OCA.Files.fileActions !== 'undefined'
	) {
		$.get(
			OC.filePath('offigimp', 'ajax', 'mimes.php'),
			{},
			odfViewer.register
		);

		$.get(
			OC.filePath('offigimp', 'ajax', 'settings.php'),
			{},
			odfViewer.registerFilesMenu
		);
	}

	$('#odf_close').live('click', odfViewer.onClose);
});
