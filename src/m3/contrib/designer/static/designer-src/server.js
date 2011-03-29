/**
 * Crafted by ZIgi
 */

/**
 * ������ ��� ������ ������� � ��������
 * cfg = {
 *  id:507 - id ���������
 *  loadUrl:'foo.bar',  - url ��� �������� ������
 *  saveUrl:'foo.bar', - url ��� ���������� ������
 *  maskEl: Ext.getBody() - ������� ���� ������ �����
 * }
 */

ServerStorage = Ext.extend(Ext.util.Observable, {

    constructor: function(cfg){
        Ext.apply(this, cfg);
        ServerStorage.superclass.constructor.call(this);
        this.addEvents('load');
    },
    loadModel:function(){
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'�������� ������...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url:this.loadUrl,
            params:{
                id:this.id
            },
            success:this._onLoadSuccess.createDelegate(this),
            failure:this._onLoadFailure.createDelegate(this)
        });
    },
    saveModel:function(){
        // Not implemented yet
    },
    _onLoadSuccess:function(response, opts) {
        var obj = Ext.util.JSON.decode(response.responseText);
        this.mask.hide();
        this.fireEvent('load', obj);
    },
    _onLoadFailure:function(response, opts){
        this.mask.hide();
        uiAjaxFailMessage(response, opts);
        //Ext.Msg.alert('������','��������� ������ ��� ������������ ������ ���������');
    }
});
