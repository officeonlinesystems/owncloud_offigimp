<?php
/**
 * ownCloud - OffiGimp App
 */

namespace OCA\OffiGimp\AppInfo;

use \OCP\AppFramework\App;

use \OCA\OffiGimp\Controller\UserController;
use \OCA\OffiGimp\Controller\SessionController;
use \OCA\OffiGimp\Controller\DocumentController;
use \OCA\OffiGimp\AppConfig;

class Application extends App {
	public function __construct (array $urlParams = array()) {
		parent::__construct('offigimp', $urlParams);

		$container = $this->getContainer();

		/**
		 * Controllers
		 */
		$container->registerService('UserController', function($c) {
			return new UserController(
				$c->query('AppName'),
				$c->query('Request')
			);
		});
		$container->registerService('SessionController', function($c) {
			return new SessionController(
				$c->query('AppName'),
				$c->query('Request'),
				$c->query('Logger'),
				$c->query('UserId')
			);
		});
		$container->registerService('DocumentController', function($c) {
			return new DocumentController(
				$c->query('AppName'),
				$c->query('Request'),
				$c->query('CoreConfig'),
				$c->query('AppConfig'),
				$c->query('L10N'),
				$c->query('UserId'),
				$c->query('ICacheFactory'),
				$c->query('Logger')
			);
		});

		$container->registerService('AppConfig', function($c) {
			return new AppConfig(
				$c->query('CoreConfig')
			);
		});

		/**
		 * Core
		 */
		$container->registerService('Logger', function($c) {
			return $c->query('ServerContainer')->getLogger();
		});
		$container->registerService('CoreConfig', function($c) {
			return $c->query('ServerContainer')->getConfig();
		});
		$container->registerService('L10N', function($c) {
			return $c->query('ServerContainer')->getL10N($c->query('AppName'));
		});
		$container->registerService('UserId', function($c) {
			$user = $c->query('ServerContainer')->getUserSession()->getUser();
			$uid = is_null($user) ? '' : $user->getUID();
			return $uid;
		});
		$container->registerService('ICacheFactory', function($c) {
			return $c->query('ServerContainer')->getMemCacheFactory();
		});
	}
}
