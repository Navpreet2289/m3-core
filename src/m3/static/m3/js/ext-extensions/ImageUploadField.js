Ext.ns('Ext.ux.form');

Ext.ux.form.ImageUploadField = Ext.extend(Ext.form.FileUploadField,  {

     /**
     * Класс иконки для выбора файла
     */
     iconClsSelectFile: 'x-form-image-icon'
    
    /**
     * Класс иконки для очистки файла 
     */
    ,iconClsClearFile: 'x-form-image-clear-icon'

    /**
     * Класс иконки для предпросмотра файла
     */
    ,iconClsPreviewImage: 'x-form-image-preview-icon'
    
    ,constructor: function(baseConfig, params){
        
        if (params) {
            if (params.thumbnailWidth) {
                this.thumbnailWidth = params.thumbnailWidth;
            }
            if (params.thumbnailHeight) {
                this.thumbnailHeight = params.thumbnailHeight;
            }
            if (params.prefixThumbnailImg) {
                this.prefixThumbnailImg = params.prefixThumbnailImg;
            }
            if (params.thumbnail) {
                this.thumbnail = params.thumbnail;
            }
            
        if (params.fileUrl) {
            var mass = params.fileUrl.split('/');
            var dir = mass.slice(0, mass.length - 1);
            var file_name = mass[mass.length-1];
            var prefix = this.prefixThumbnailImg || '';
            var url = String.format('{0}/{1}{2}', dir.join('/'), prefix, file_name);
            
            this.previewTip = new Ext.QuickTip({
                id: 'preview_tip_window',  
                html: String.format('<a href="{0}" rel="lightbox"><image src="{1}" WIDTH={2} HEIGHT={3} OnClick=Ext.getCmp("preview_tip_window").hide()></a>', 
                        params.fileUrl,
                        this.getFileUrl(url),
                        this.thumbnailWidth,
                        this.thumbnailHeight)
                ,autoHide: false
                ,width: this.thumbnailWidth + 10
                ,height: this.thumbnailHeight + 10
            });
        }
        }        
        
        Ext.ux.form.ImageUploadField.superclass.constructor.call(this, baseConfig, params);
    }     
    ,renderHelperBtn: function(){
        if (this.thumbnail) {
            this.buttonPreview = new Ext.Button({
                renderTo: this.wrap
                ,width: 16
                ,cls: 'x-form-file-download'
                ,iconCls: this.iconClsPreviewImage
                ,handler: this.clickHelperBtn
                ,scope: this
                ,hidden: this.value ? false : true
                ,tooltip: {
                    text: 'Предварительный показ'
                    ,width: 140
                }
            });
        }
    }
    ,getHelperBtn: function(){
        return this.buttonPreview;
    }
    ,clickHelperBtn: function(){
        var el = this.getEl();
        var xy = el.getXY()
        this.previewTip.showAt([xy[0], xy[1] + el.getHeight()]);
    }
    ,createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });
        
        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать изображение',
            width: 130,
            dismissDelay: 10000 
        });
    }
    ,onDestroy: function(){
        Ext.ux.form.ImageUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.previewTip);
    }
});
// Регистрация lightbox
Ext.ux.Lightbox.register('a[rel^=lightbox]');
Ext.reg('imageuploadfield', Ext.ux.form.ImageUploadField);
