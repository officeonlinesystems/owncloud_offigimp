<?php

/**
 * ownCloud - OffiGimp App
 */

namespace OCA\OffiGimp\Db;

/**
 * @method boolean getIsGuest()
 * @method string getEsId()
 * @method string getToken()
 * @method int getStatus()
 */

class Member extends \OCA\OffiGimp\Db{

	const DB_TABLE = '`*PREFIX*offigimp_member`';

	const ACTIVITY_THRESHOLD = 90; // 1.5 Minutes
	
	const MEMBER_STATUS_ACTIVE = 1;
	const MEMBER_STATUS_INACTIVE = 2;
	
	protected $tableName  = '`*PREFIX*offigimp_member`';

	protected $insertStatement  = 'INSERT INTO `*PREFIX*offigimp_member` (`es_id`, `uid`, `color`, `last_activity`, `is_guest`, `token`)
			VALUES (?, ?, ?, ?, ?, ?)';
	
	protected $loadStatement = 'SELECT * FROM `*PREFIX*offigimp_member` WHERE `member_id`= ?';

	public static function getGuestPostfix(){
		return '(' . \OC::$server->getL10n('offigimp')->t('guest') . ')';
	}


	public function updateActivity($memberId){
		return $this->execute(
				'UPDATE ' . $this->tableName . ' SET `last_activity`=?, `status`=? WHERE `member_id`=?',
				array(
					time(),
					self::MEMBER_STATUS_ACTIVE,
					$memberId
				)
		);
	}
	
	
	public function getActiveCollection($esId){
		$result = $this->execute('
			SELECT `es_id`, `member_id`
			FROM ' . self::DB_TABLE . '
			WHERE `es_id`= ?
				AND `status`=?
			',
			array(
				$esId,
				self::MEMBER_STATUS_ACTIVE
			)
		);
		$members = $result->fetchAll();
		if (!is_array($members)){
			$members = array();
		}
		return $members;
		
	}
	
	/**
	 * Mark members as inactive
	 * @param string $esId - session Id
	 * @return array - list of memberId that were marked as inactive
	 */
	public function updateByTimeout($esId){
		$time = $this->getInactivityPeriod();

		$result = $this->execute('
			SELECT `member_id`
			FROM ' . self::DB_TABLE . '
			WHERE `es_id`= ?
				AND `last_activity`<?
				AND `status`=?
			',
			array(
				$esId,
				$time,
				self::MEMBER_STATUS_ACTIVE
			)
		);
		
		$deactivated = $result->fetchAll();
		if (is_array($deactivated) && count($deactivated)){
			$deactivated = array_map(
				function($x){
					return ($x['member_id']);
				}, $deactivated
			);
			$this->deactivate($deactivated);
		} else {
			$deactivated = array();
		}

		return $deactivated;
	}

	/**
	 * Update members to inactive state
	 * @param array $memberIds
	 */
	public function deactivate($memberIds){
		$stmt = $this->buildInQuery('member_id', $memberIds);
		array_unshift($memberIds, self::MEMBER_STATUS_INACTIVE);
		$this->execute('
			UPDATE ' . $this->tableName . '
			SET `status`=?
			WHERE ' . $stmt,
			$memberIds
		);
	}
	
	protected function getInactivityPeriod(){
		return time() - self::ACTIVITY_THRESHOLD;
	}
}
