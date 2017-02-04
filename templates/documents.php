<?php
style( 'offigimp', 'style' );
script('offigimp', 'documents');
?>
<div id="documents-content">
	<ul class="documentslist">
		<li class="add-document">
			<a class="icon-add add-img svg" target="_blank" href="">
				<label><?php p($l->t('New Image')) ?></label>
			</a>
		</li>
		<li class="progress icon-loading"><div><?php p($l->t('Loading images...')); ?></div></li>
		<li class="document template" data-id="" style="display:none;">
			<a target="_blank" href=""><label></label></a>
		</li>
	</ul>
</div>
<?php if ($_['enable_previews']): ?>
<input type="hidden" id="previews_enabled" value="<?php p($_['enable_previews']) ?>" />
<?php endif; ?>
<input type="hidden" name="allowShareWithLink" id="allowShareWithLink" value="<?php p($_['allowShareWithLink']) ?>" />
