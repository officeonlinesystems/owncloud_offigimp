<?php

/**
 * ownCloud - OffiGimp App
 */


namespace OCA\OffiGimp;

class Storage {
	public static $MIMETYPE_OFFIGIMP = array(
		'image/png',
		'image/jpeg',
		'image/jpg',
		'image/bmp',
		'image/gif',
		'image/tiff'
	);

	public static function getDocuments() {
		$list = array_filter(
				self::searchDocuments(),
				function($item){
					//filter Deleted
					if (strpos($item['path'], '_trashbin')===0){
						return false;
					}
					return true;
				}
		);

		return $list;
	}

	public static function getDocumentById($fileId){
		$root = \OC::$server->getUserFolder();
		$ret = array();

		// If type of fileId is a string, then it
		// doesn't work for shared documents, lets cast to int everytime
		$document = $root->getById((int)$fileId)[0];
		if ($document === null){
			error_log('File with file id, ' . $fileId . ', not found');
			return $ret;
		}

		$ret['mimetype'] = $document->getMimeType();
		$ret['path'] = $root->getRelativePath($document->getPath());
		$ret['name'] = $document->getName();
		$ret['fileid'] = $fileId;

		return $ret;
	}

	public static function resolvePath($fileId){
		$list = array_filter(
				self::searchDocuments(),
				function($item) use ($fileId){
					return intval($item['fileid'])==$fileId;
				}
		);
		if (count($list)>0){
			$item = current($list);
			return $item['path'];
		}
		return false;
	}

	/**
	 * @brief Cleanup session data on removing the document
	 * @param array
	 *
	 * This function is connected to the delete signal of OC_Filesystem
	 * to delete the related info from database
	 */
	public static function onDelete($params) {
		$info = \OC\Files\Filesystem::getFileInfo($params['path']);

		$fileId = @$info['fileid'];
		if (!$fileId){
			return;
		}

		$session = new Db\Session();
		$session->loadBy('file_id', $fileId);

		if (!$session->getEsId()){
			return;
		}

		$member = new Db\Member();
		$sessionMembers = $member->getCollectionBy('es_id', $session->getEsId());
		foreach ($sessionMembers as $memberData){
			if (intval($memberData['status'])===Db\Member::MEMBER_STATUS_ACTIVE){
				return;
			}
		}

		Db\Session::cleanUp($session->getEsId());
	}

	private static function processDocuments($rawDocuments){
		$documents = array();
		$view = \OC\Files\Filesystem::getView();
		foreach($rawDocuments as $rawDocument){
			$document = array(
				'fileid' => $rawDocument->getId(),
				'path' => $view->getPath($rawDocument->getId()),
				'name' => $rawDocument->getName(),
				'mimetype' => $rawDocument->getMimetype(),
				'mtime' => $rawDocument->getMTime()
				);

			array_push($documents, $document);
		}

		return $documents;
	}

	protected static function searchDocuments(){
		$documents = array();
		foreach (self::getSupportedMimetypes() as $mime){
			$rawDocuments = \OCP\Files::searchByMime($mime);
			$documents = array_merge($documents, self::processDocuments($rawDocuments));
		}

		return $documents;
	}

	public static function getSupportedMimetypes(){
		return array_merge(
			self::$MIMETYPE_OFFIGIMP,
			Filter::getAll()
		);
	}
}
