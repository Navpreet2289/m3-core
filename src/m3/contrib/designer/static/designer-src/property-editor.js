/**
 * Crafted by ZIgi
 */

/**
 *  ������ ��� ������ � ���������� �������.
 */


/**
 * ����� ������������� ������� ��������� ��� �����������. �� ��������� ������� ������ � ����������� �������, ��������
 * � ���� ����������� ��������� ������ � ��������� ������. ��� ���������� ������ ���������� ������� modelUpdate
 */

PropertyEditorManager = Ext.extend( Ext.util.Observable, {
    constructor:function() {
        PropertyEditorManager.superclass.constructor.call(this);
        this.addEvents('modelUpdate');
    },
    editModel:function(model) {
        //������ ������ ��� PropertyGrid'�
        //debugger;

        var cfg = ModelTypeLibrary.getTypeDefaultProperties(model.attributes.type);
        for (var p in model.attributes) {
            if (cfg.hasOwnProperty(p)) {
                cfg[p] = model.attributes[p];
            }
        }
        var window = new PropertyWindow({
            source:cfg,
            model:model
        });
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
    },
    saveModel:function(eventObj) {
        // � ����� ������� �������� ������ ������ � ������ source �� �����
        // ����� ���������� �������� �� ����� � �������� ������

        for (var i in eventObj.model.attributes) {
            if (eventObj.source.hasOwnProperty(i) )
            {
                eventObj.model.attributes[i] = eventObj.source[i];
            }
        }
        this.fireEvent('modelUpdate');
    }
});


/**
 *  �������������� ���� �� ���������� �������. ��� ������� ������ ��������� ������������ ������� save, �� ����
 * �������� ����� ���������
 */

PropertyWindow = Ext.extend(Ext.Window, {
    /**
     * ��������� �������:
     * cfg.source = {} - �� ��� ������������� �������� ������
     * cfg.model = ... ������ �� ������
     * @param cfg
     */
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        this.addEvents('save');
        this._grid = new Ext.grid.PropertyGrid({
                        autoHeight: true,
                        source: this.source
                    });

        Ext.apply(this, {
            height:400,
            width:400,
            title:'�������������� ����������',
            layout:'fit',
            items:[this._grid],
            buttons:[
                new Ext.Button({text:'���������',handler:this._onSave.createDelegate(this) }),
                new Ext.Button({ text:'������', handler:this._onClose.createDelegate(this) })
            ]
        });

        PropertyWindow.superclass.initComponent.call(this);
    },
    show:function( ) {
        PropertyWindow.superclass.show.call(this);
    },
    _onSave:function() {
        //TODO ���������� ���������
        var eventObj = {
            source:this._grid.getSource(),
            model:this.model
        };

        this.fireEvent('save', eventObj);
        this.hide();
    },
    _onClose:function() {
        this.hide();
    }
});