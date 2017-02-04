/*globals $,OC,fileDownloadPath,t,document,odf,alert,require,dojo,runtime,Handlebars */

var count = 15;
var wi;

var progreswindow = '<style type="text/css">.loader {position: fixed;';
progreswindow = progreswindow + 'left: 0px;';
progreswindow = progreswindow + 'text-align: center;';
progreswindow = progreswindow + 'top: 44px;';
progreswindow = progreswindow + 'width: 100%;';
progreswindow = progreswindow + 'height: 100%;';
progreswindow = progreswindow + 'z-index: 9999;';
progreswindow = progreswindow + 'color: #ffffff;'
progreswindow = progreswindow + "background: url('http://www.offidocs.com/images/page-loader.gif') 50% 50% no-repeat rgb(200,200,200);"
progreswindow = progreswindow + '}</style>';
progreswindow = progreswindow + '<html><body onload="myFunction();" style="background: url(http://www.offidocs.com/templates/beez_20/images/nature/navhoriz.png);">';
progreswindow = progreswindow + '<div style="background: #fff url(http://www.offidocs.com/templates/beez_20/images/nature/header_outer.gif) repeat-x left 0; color: #333; font-family: arial, helvetica, sans-serif;i z-index:11111;">';
progreswindow = progreswindow + '<ul style="background: url(http://www.offidocs.com/templates/beez_20/images/nature/navhoriz.png); border: 0; border-bottom: solid 1px #237D85; list-style-type: none;     display: block; margin: 0px 0px 1px 0px; text-align: right; list-style-type: none; padding: 10px 0px 10px 0px; ">';
progreswindow = progreswindow + '<li style="">';
progreswindow = progreswindow + '<a style="font-size:13px; margin-right: 6%; text-decoration: none; font-weight: bold; text-transform: uppercase; color: #333; border-right: solid 1px #237D85; background: #bddfb3 !important; padding: 10px;" href="/" >Home';
progreswindow = progreswindow + '</a></li></ul></div>';
progreswindow = progreswindow + '<div id="loader" class="loader">';
progreswindow = progreswindow + '<h1 style="margin:auto; margin-top: 50px;">This platform is working for you.</h1>';
progreswindow = progreswindow + '<h1 style="margin:auto; margin-top: 0px;">We are preparing the app environment.</h1>';
progreswindow = progreswindow + '<h2>Be patient, it takes less than 15 seconds.</h2>';
progreswindow = progreswindow + '<div style="font-size: 80px; color: #000000; z-index: 10000; top: 44px; height: 100%; width: 100%; text-align: center; position: fixed; left: 0px; display: table;">';
progreswindow = progreswindow + '<span id="numeritos" style="display: table-cell; vertical-align: middle;">';
progreswindow = progreswindow + '</span>';
progreswindow = progreswindow + '</div></body></html>';

$.widget('oc.documentGrid', {
	options : {
		context : '.documentslist',
		documents : {},
		sessions : {},
		members : {}
	},

	_create : function (){

	},

	render : function(fileId){
		var that = this;
		jQuery.when(this._load(fileId))
			.then(function(){
				that._render();
				documentsMain.renderComplete = true;
			});
	},

	add : function(document) {
		var docElem = $(this.options.context + ' .template').clone(),
			a = docElem.find('a')
		;

		//Fill an element
		docElem.removeClass('template').attr('data-id', document.fileid);
		a.css('background-image', 'url("'+document.icon+'")')
			.attr('href', 'http://www.offidocs.com/')
			.attr('title', document.path)
			.attr('original-title', document.path)
			.attr('action', document.action)
			.attr('lolang', document.lolang)
			.find('label').text(document.name)
		;

		docElem.appendTo(this.options.context).show();

		//Preview
		var previewURL,
			urlSpec = {
			file : document.path.replace(/^\/\//, '/'),
			x : 200,
			y : 200,
			c : document.etag,
			forceIcon : 0
		};

		if ( $('#isPublic').length ) {
			urlSpec.t = $('#dirToken').val();
		}

		if (!urlSpec.x) {
			urlSpec.x = $('#filestable').data('preview-x');
		}
		if (!urlSpec.y) {
			urlSpec.y = $('#filestable').data('preview-y');
		}
		urlSpec.y *= window.devicePixelRatio;
		urlSpec.x *= window.devicePixelRatio;

		previewURL = OC.generateUrl('/core/preview.png?') + $.param(urlSpec);
		previewURL = previewURL.replace('(', '%28').replace(')', '%29');

		if ( $('#previews_enabled').length && document.hasPreview) {
			var img = new Image();
			img.onload = function(){
				var ready = function (node){
					return function(path){
						node.css('background-image', 'url("'+ path +'")');
					};
				}(a);
				ready(previewURL);
			};
			img.src = previewURL;
		}
	},

	_load : function (fileId){
		var that = this;
		var url = 'apps/offigimp/ajax/documents/list';
		var dataObj = {};
		if (fileId){
			url = 'apps/offigimp/ajax/documents/get/{fileId}';
			dataObj = { fileId: fileId };
		}

		return $.getJSON(OC.generateUrl(url, dataObj))
			.done(function (result) {
				if (!result || result.status === 'error') {
					documentsMain.loadError = true;
					if (result && result.message) {
						documentsMain.loadErrorMessage = result.message;
					}
					else {
						documentsMain.loadErrorMessage = t('offigimp', 'Failed to load the document, please contact your administrator.');
					}

					if (result && result.hint) {
						documentsMain.loadErrorHint = result.hint;
					}
				}
				else {
					that.options.documents = result.documents;
					that.options.sessions = result.sessions;
					that.options.members = result.members;
				}
			})
			.fail(function(data){
				console.log(t('offigimp','Failed to load documents.'));
			});
	},

	_render : function (data){
		var that = this,
			documents = data && data.documents || this.options.documents,
			sessions = data && data.sessions || this.options.sessions,
			members = data && data.members || this.options.members,
			hasDocuments = false
		;

		$(this.options.context + ' .document:not(.template,.progress)').remove();

		if (documentsMain.loadError) {
			$(this.options.context).after('<div id="errormessage">'
				+ '<p>' + documentsMain.loadErrorMessage + '</p><p>'
				+ documentsMain.loadErrorHint
				+ '</p></div>'
			);
			return;
		}

		$.each(documents, function(i, document){
			hasDocuments = true;
			that.add(document);
		});

		$.each(sessions, function(i, session){
			if (members[session.es_id].length > 0) {
				var docElem = $(that.options.context + ' .document[data-id="'+session.file_id+'"]');
				if (docElem.length > 0) {
					docElem.attr('data-esid', session.es_id);
					docElem.find('label').after('<img class="svg session-active" src="'+OC.imagePath('core','places/contacts-dark')+'">');
					docElem.addClass('session');
				} else {
					console.log('Could not find file '+session.file_id+' for session '+session.es_id);
				}
			}
		});

		if (!hasDocuments){
			$(this.options.context).before('<div id="emptycontent">'
				+ t('offigimp', 'No documents were found. Upload or create a document to get started!')
				+ '</div>'
			);
		} else {
			$('#emptycontent').remove();
		}
	}
});

$.widget('oc.documentOverlay', {
	options : {
		parent : 'document.body'
	},
	_create : function (){
		$(this.element).hide().appendTo(document.body);
	},
	show : function(){
		$(this.element).fadeIn('fast');
	},
	hide : function(){
		$(this.element).fadeOut('fast');
	}
});

var documentsMain = {
	isEditorMode : false,
	isViewerMode: false,
	isGuest : false,
	memberId : false,
	esId : false,
	ready :false,
	fileName: null,
	baseName: null,
	canShare : false,
	canEdit: false,
	loadError : false,
	loadErrorMessage : '',
	loadErrorHint : '',
	renderComplete: false, // false till page is rendered with all required data about the document(s)
	toolbar : '<div id="ocToolbar"><div id="ocToolbarInside"></div><span id="toolbar" class="claro"></span></div>',
	returnToDir : null, // directory where we started from in the 'Files' app

	UI : {
		/* Editor wrapper HTML */
		container : '<div id="mainContainer" class="claro">' +
					'</div>',

		viewContainer: '<div id="revViewerContainer" class="claro">' +
					   '<div id="revViewer"></div>' +
					   '</div>',

		mainTitle : '',
		revisionsStart: 0,

		init : function(){
			documentsMain.UI.mainTitle = $('title').text();
		},

		showProgress : function(message){
			if (!message){
				message = '&nbsp;';
			}
			$('.documentslist .progress div').text(message);
			$('.documentslist .progress').show();
		},

		hideProgress : function(){
			$('.documentslist .progress').hide();
		},

		notify : function(message){
			OC.Notification.show(message);
			setTimeout(OC.Notification.hide, 10000);
		}
	},

	onStartup: function() {
		var fileId;
		documentsMain.UI.init();

		if (!OC.currentUser){
			documentsMain.isGuest = true;

			if ($("[name='document']").val()){
				$(documentsMain.toolbar).appendTo('#header');
				documentsMain.prepareSession();
				documentsMain.joinSession(
					$("[name='document']").val()
				);
			}

		} else {
			// Does anything indicate that we need to autostart a session?
			fileId = parent.location.hash.replace(/^\W*/, '');

			if (fileId.indexOf('_') >= 0) {
				documentsMain.returnToDir = unescape(fileId.replace(/^[^_]*_/, ''));
				fileId = fileId.replace(/_.*/, '');
			}
		}

		localStorage.setItem('namexxx', "owncloud_" + OC.currentUser);
                var usernamex = localStorage.getItem("namexxx");

		documentsMain.show(fileId);


		if (fileId) {
			documentsMain.overlay.documentOverlay('show');
			documentsMain.prepareSession();
			documentsMain.joinSession(fileId);

		}

		documentsMain.ready = true;
	},

	prepareGrid : function(){
		documentsMain.isEditorMode = false;
		documentsMain.overlay.documentOverlay('hide');
	},

	joinSession: function(fileId, hrefx, titlex) {

		var usernamex = localStorage.getItem("namexxx");
                if ( !usernamex )
                {
                        usernamex = Math.floor(Date.now() / 1000);
                        localStorage.setItem('namexxx', usernamex);
                }

		count = 15;
		wi = window.open('about:blank', '_blank');
		wi.document.write(progreswindow);
		//$(wi.document.body).html(progreswindow);
		countero();

		$.post(OC.filePath('offigimp', 'ajax', 'edit.php'), { title: titlex, username: usernamex }, function(result) {
                     if (result && result.status == 'success') {
				server = parseBetween("SERVER", "GUESTX", result.redirect);
                                numserver = server.replace("community", "");
				guest = parseBetween("GUESTX", "FIN", result.redirect);
                                numguest = guest.replace("guest", "");
				finalurl = encodeURIComponent("http://www.offidocs.com/osessionx" + numserver + "/#/?username=" + guest + "&password=server01" + numguest);
                                finalurl =  "http://www.offidocs.com/setusername.php?username=" + usernamex + "&url=" + finalurl;
				wi.location.href = finalurl;

                     } else {
				alert("Error opening file");
                     }
                 });


        },

	onCreateIMG: function(event){
		event.preventDefault();
		var username = localStorage.getItem("namexxx");
        	if ( !username )
        	{
                	username = Math.floor(Date.now() / 1000);
                	localStorage.setItem('namexxx', username);
        	}
		var filename = Math.floor(Date.now() / 1000);
		window.open("http://www.offidocs.com/edit-gimp.php?fileurl=newfileoriginal", '_blank');
	},


	onTerminate: function(){
		var url = '';
		if (documentsMain.isGuest){
			url = OC.generateUrl('apps/offigimp/ajax/user/disconnectGuest/{member_id}', {member_id: documentsMain.memberId});
		} else {
			url = OC.generateUrl('apps/offigimp/ajax/user/disconnect/{member_id}', {member_id: documentsMain.memberId});
		}
		$.ajax({
				type: "POST",
				url: url,
				data: {esId: documentsMain.esId},
				dataType: "json",
				async: false // Should be sync to complete before the page is closed
		});

		if (documentsMain.isGuest){
			$('footer,nav').show();
		}
	},

	show: function(fileId){
		if (documentsMain.isGuest){
			return;
		}
		documentsMain.UI.showProgress(t('offigimp', 'Loading documents...'));
		documentsMain.docs.documentGrid('render', fileId);
		documentsMain.UI.hideProgress();
	}
};

//init
var Files = Files || {
	isFileNameValid:function (name) {
		if (name === '.') {
			throw t('files', '\'.\' is an invalid file name.');
		} else if (name.length === 0) {
			throw t('files', 'File name cannot be empty.');
		}

		// check for invalid characters
		var invalid_characters = ['\\', '/', '<', '>', ':', '"', '|', '?', '*'];
		for (var i = 0; i < invalid_characters.length; i++) {
			if (name.indexOf(invalid_characters[i]) !== -1) {
				throw t('files', "Invalid name, '\\', '/', '<', '>', ':', '\"', '|', '?' and '*' are not allowed.");
			}
		}
		return true;
	},

	updateStorageStatistics: function(){}
},
FileList = FileList || {};

FileList.getCurrentDirectory = function(){
	return $('#dir').val() || '/';
};

FileList.highlightFiles = function(files, highlightFunction) {
};

FileList.findFile = function(filename) {
	var documents = documentsMain.docs.documentGrid('option').documents;
	return _.find(documents, function(aFile) {
				return (aFile.name === filename);
			}) || false;
};

FileList.setViewerMode = function(){
};
FileList.findFile = function(fileName){
	fullPath = escapeHTML(FileList.getCurrentDirectory + '/' + fileName);
	return !!$('.documentslist .document:not(.template,.progress) a[original-title="' + fullPath + '"]').length;
};

$(document).ready(function() {

	if (!OCA.Files) {
		OCA.Files = {};
		OCA.Files.App = {};
		OCA.Files.App.fileList = FileList;
	}

	if (!OC.Share) {
		OC.Share = {};
	}

	window.Files = FileList;

	documentsMain.docs = $('.documentslist').documentGrid();
	documentsMain.overlay = $('<div id="documents-overlay" class="icon-loading"></div><div id="documents-overlay-below" class="icon-loading-dark"></div>').documentOverlay();

	$('li.document a').tipsy({fade: true, live: true});

	$('.documentslist').on('click', 'li:not(.add-document)', function(event) {
		event.preventDefault();

		if (documentsMain.isEditorMode){
			return;
		}

		var item = $(this).find('a');

		if ($(this).attr('data-id')){
			documentsMain.joinSession($(this).attr('data-id'), item.attr('href'), item.attr('title'));
		}
	});

	console.log("documents ready");


	$('.add-document').on('click', '.add-img', documentsMain.onCreateIMG);

	documentsMain.onStartup();

});

function parseBetween(beginString, endString, originalString) {
    var beginIndex = originalString.indexOf(beginString);
    if (beginIndex === -1) {
        return null;
    }
    var beginStringLength = beginString.length;
    var substringBeginIndex = beginIndex + beginStringLength;
    var substringEndIndex = originalString.indexOf(endString, substringBeginIndex);
    if (substringEndIndex === -1) {
        return null;
    }
    return originalString.substring(substringBeginIndex, substringEndIndex);
}

function countero()
{
	try {
		wi.document.getElementById("numeritos").innerHTML = count;
	}
	catch(err) {
		return;
	}
        setTimeout(
                function(){
                        count = count - 1;
                        countero();
                 },
                1000);
}
