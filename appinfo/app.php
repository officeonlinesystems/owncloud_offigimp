<?php

/**
 * ownCloud - OffiGimp App
 */

namespace OCA\OffiGimp\AppInfo;

use OCA\OffiGimp\Config;

$app = new Application();
$c = $app->getContainer();

\OCP\App::registerAdmin('offigimp', 'admin');

$navigationEntry = function () use ($c) {
	return [
		'id' => 'offigimp_index',
		'order' => 2,
		'href' => $c->query('ServerContainer')->getURLGenerator()->linkToRoute('offigimp.document.index'),
		'icon' => $c->query('ServerContainer')->getURLGenerator()->imagePath('offigimp', 'app.svg'),
		'name' => $c->query('L10N')->t('OffiGimp')
	];
};
$c->getServer()->getNavigationManager()->add($navigationEntry);

//Script for registering file actions
$eventDispatcher = \OC::$server->getEventDispatcher();
$eventDispatcher->addListener(
	'OCA\Files::loadAdditionalScripts',
	function() {
		\OCP\Util::addScript('offigimp', 'viewer/viewer');
		\OCP\Util::addStyle('offigimp', 'viewer/odfviewer');
	}
);

if (class_exists('\OC\Files\Type\TemplateManager')) {
    $manager = \OC_Helper::getFileTemplateManager();

    $manager->registerTemplate('image/jpeg', 'apps/offigimp/assets/imagetemplate.jpg');
}

//Listen to delete file signal
\OCP\Util::connectHook('OC_Filesystem', 'delete', "OCA\OffiGimp\Storage", "onDelete");
