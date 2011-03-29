/**
 * Crafted by ZIgi
 */

/**
 * ������ �������������. ������� ������ - ������ ���������� �������� �� ������� ���������� ������,
 * ����� ������ ����������� ������������, ������������� ���������������� ��� �������� �������
 * ��� MVC ���.
 */

BaseView = Ext.extend(Object, {
    _modelEventsActive:true,
    constructor: function(model) {
        this._model = model;
        this._model.on('append', this._beforeRefresh.createDelegate(this));
        this._model.on('insert', this._beforeRefresh.createDelegate(this));
        this._model.on('move', this._beforeRefresh.createDelegate(this));
        this._model.on('remove', this._beforeRefresh.createDelegate(this));

    },
    /**
     * ����� ������ ������ ������ ������ �� ��������������
     */
    suspendModelListening:function() {
        this._modelEventsActive = false;
    },
    /**
     * ���� ������ ������ ������ ��������������
     */
    resumeModelListening:function() {
        this._modelEventsActive = true;
    },
    _beforeRefresh:function() {
        if (this._modelEventsActive) {
            this.refresh();
        }
    },
    refresh:function(){
        //������������ � �������� �������
    }
});

/**
 *  ����� ����������� ��� ������������� ������ � ��������� ������. � ����������� ����������
 * ��������� Ext.Container(� ������� ��� ����� ���� Ext.Panel ��� Ext.Window) � ���������� ������
 * ��� ������ ������ refresh() ������ ���������� ���������� ��������� � ����������� ������������� ���������� UI
 * �� ������
 */

DesignView = Ext.extend(BaseView, {
    constructor: function(container, model) {
        this._container = container;
        DesignView.superclass.constructor.call(this, model);
    },
    refresh: function(){
        this._container.removeAll();

        var recursion = function(container, model) {
            var newComponent = this._createComponent( model );
            if (newComponent){
                container.add( newComponent );
            }
            if (model.isContainer() && model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i++) {
                    recursion.call(this, newComponent,  model.childNodes[i] );
                }
            }
        };

        recursion.call(this, this._container, this._model.root);
        this._container.doLayout(true, true);
    },
    _createComponent:function(model) {
        return ModelUtils.buildExtUIComponent(model);
    }
});

/*
* ��������� ���������� ������ �� ������
 */

ComponentTreeView = Ext.extend(BaseView, {
    constructor: function(tree, model) {
        this._tree = tree;
        ComponentTreeView.superclass.constructor.call(this, model);

        new Ext.tree.TreeSorter(this._tree, {
            folderSort:true,
            dir:'asc',
            property:'orderIndex'
        });
    },
    refresh:function() {
        var root = this._tree.root;
        root.removeAll(true);

        var recursion = function(parent, model) {
            var newNode = ModelUtils.buildTreeNode(model);
            parent.appendChild(newNode);

            if (model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i ++) {
                    recursion(newNode, model.childNodes[i]);
                }
            }
        };
        recursion(root, this._model.root);
    }
});
