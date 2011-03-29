/**
 * Crafted by ZIgi
 */

/* ����� ����������� ����������. �������� ����� ����� ������� ������� ����������.
* ��� �������� ����������
* ������ ���� ������� ������ ���������� ����:
*
* config = {
*   tree = ...,
*   container = ...,
*   toolbox = ...,
* }
*
 */

AppController = Ext.extend(Object, {
   constructor: function(config) {
       Ext.apply(this, config);
       this._initCSSRules();
   },
   init: function(documentCfg) {
       //������� ������
       this._model = DocumentModel.initFromJson(documentCfg);
       //������� ������� ������������� ������
       this._treeView = new ComponentTreeView(this.tree, this._model);
       this._designView = new DesignView(this.designPanel, this._model);
       //�������������� id � ������ - ������ ���������� � ���� ������
       //��������� ��� ������ ���� ����� � �������� � ������
       this._model.root.setId( this.designPanel.id);
       //������� ������ ���������� �� �������������� �������
       this._editorManager = new PropertyEditorManager();
       //�������� �������
       this._initToolbox(this.toolbox);
       //��������� �� � �������� �� ������
       this._initDesignDD(this.designPanel);

       //����������� �������
       this.tree.on('beforenodedrop', this.onBeforeNodeDrop.createDelegate(this));
       this.tree.on('nodedrop', this.onTreeNodeDrop.createDelegate(this));
       this.tree.on('dblclick', this.onTreeNodeDblClick.createDelegate(this));
       this._editorManager.on('modelUpdate', this.onModelUpdate.createDelegate(this));


       //������� �������� �������������
       this.refreshView();
   },
   _initCSSRules:function() {
       //TODO ��������� � CSS ����!
       //�����-������ ��� ��� ������������ ����������� ������� � ���������. � ���� ����� ����� ��� �������
       //��������� CSS'�� � ��������

       Ext.util.CSS.createStyleSheet(
               '.selectedElement {' +
                    'border: 2px solid #710AF0;'+
               '}','selectedElem');

       //selectedElement �������� �� ��� ������, �� �������� ��������� �� ������, ������ etc
       //������� ���������� ���� � body
       Ext.util.CSS.createStyleSheet(
               '.selectedElement * .x-panel-body {' +
                   'border: 2px solid #710AF0;' +
               '}'
               ,'selectedPanelBody');

   },
   _initDesignDD:function() {
       /**
        * ������� �������� ���� ��� ����� � �������� - ������� � ������ ��������� ����������
        * � ���� ddGroup. �� DOM ������� ������ ��������� �������� Ext.dd.DropZone
        * ��� ����� ������� ������������� ��� ������� � ������ ����� �� ��������� Drop ��������,
        * � ��� � ��� ������ ���� ����� �����
        */

       //��� ���� ����� �������� ��� � DOM ������ �������� ����������(����� ��������� Ext.Container)
       //� ������� ����� ��������� ����� ����������(����� Ext.Component)
       //������������ �������� CSS ����� .designContainer
       //����� ������� �������� ���������� - ���������� ���������� ��� �����

       this.designPanel.dropZone = new Ext.dd.DropZone( this.designPanel.getEl(), {
               ddGroup:'designerDDGroup',

               // ���������� �����. ������� ������� �������� ��������������,
               // ����� �������� ������� ��������� �� ������� �� ������ ������� ����������,
               // ����� ��� ������ ��� ������ ������� ��������� ���� ���� ����� ���������� �� ������
               // ���������� onNodeDrop. �, ���, ���� ���� �� ��������� Observable
               // ��, ������, ��� � ����������� ��� ��� �� ���� �������
               processDropResults : this.domNodeDrop.createDelegate(this),

               getTargetFromEvent: function(e) {
                   //���� �������� ������� DOM �������, ����� �������� ����� ��������� ����������
                   //���������. getTarget ���� �� ��������� ��� � ������� �������, ��� � ������� �������, ��
                   //�� � �����������. �� ������� ������ ��� null � ������� ���� ������ �� ����� ������,
                   //��� target'�� ������ ��������� �������� ���������(������ DOM ������� ������� ���� ��������
                   //������������)
                   return e.getTarget('.designContainer');
               },
               onNodeEnter: function(target, dd, e, data) {
                   Ext.fly(target).addClass('selectedElement');
               },
               onNodeOut:function(target, dd, e, data){
                   Ext.fly(target).removeClass('selectedElement');
               },
               onNodeOver:function(target, dd, e, data) {
                   //����� ����� ����� �������� ������ '����� �������' �� ������
                   return Ext.dd.DropZone.prototype.dropAllowed;
               },
               onNodeDrop:function(target, dd, e, data) {
                   this.processDropResults(target, dd, e, data);
               }
           });
   },
   _initToolbox:function(toolbox) {
            var root = toolbox.getRootNode();
            root.appendChild(ModelTypeLibrary.getToolboxData() );
   },
    /*
    * ������ ��� ��������������
    */
   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },

   /*
    * ��������� ����� �� �������� �����������. ��������� ��� TreeNode � ������ � ��������� ������������
    * ���� �����
    */
   moveTreeNode:function(drop, target, point) {
        var sourceModel = this._model.findModelById(drop.attributes.id);
        var targetModel = this._model.findModelById(target.attributes.id);

       //��������� ��������� ���� ��� ���������� ��� �������� - �������� � ������ � ������ ��������
       //������� ������ ��� ������� �������� ���������� UI, ��� ��� ����� ������� js ������ ��� �����������
       //������ � ������������ ������ ������ treeSorter'�

       //TODO ������ ��� ��� ���������� �� ���������! ���� ����������� ������� � beforeDrop ��� �� ������� � ����

       this._treeView.suspendModelListening();
       this._designView.suspendModelListening();

       this._moveModelComponent(sourceModel, targetModel, point);

       this.refreshView();

       this._treeView.resumeModelListening();
       this._designView.resumeModelListening();

       return false;
   },
   /*
    * ����������� ������� � ������ ���������
    */
   _moveModelComponent:function( source, target, point) {
       if(point == 'append') {
           target.appendChild(source);
       }
       else if (point == 'above') {
           var parent = target.parentNode;
           parent.insertBefore(source, target);
       }
       else if (point == 'below') {
           target.parentNode.insertBefore(source, target.nextSibling);
       }
   },
   /*
   * ��������� ����� � �������� � ��������
   */
   domNodeDrop:function(target, dd, e, data ) {
       var componentNode = data.node;
       var model = this._model.findModelById(target.id);

       var newModelConfig = ModelTypeLibrary.getTypeDefaultProperties(componentNode.attributes.type);
       newModelConfig.type = componentNode.attributes.type;
       model.appendChild( new ComponentModel(newModelConfig) );
   },
   /*
   * ���������� ������ ��� �������� �� ������
   */
   getTransferObject:function() {
       return ModelUtils.buildTransferObject(this._model);
   },
   onBeforeNodeDrop:function(dropEvent) {
        if (dropEvent.target.isRoot) {
            //��� �� ������������, � � ���� ������ �������������
            return false;
        }
        return !(this._model.findModelById(dropEvent.target.id).type == 'document' && (dropEvent.point == 'above' ||
                dropEvent.point == 'below'));

   },
   onTreeNodeDrop: function(dropEvent) {
       this.moveTreeNode(dropEvent.dropNode, dropEvent.target, dropEvent.point);
       return false;
   },
   onTreeNodeDblClick:function(node, e) {
       var model = this._model.findModelById(node.id);
       this._editorManager.editModel(model);
   },
   onTreeNodeDeleteClick:function(treeNode) {
       var model = this._model.findModelById(treeNode.id);
       model.remove(true);
   },
   onModelUpdate:function() {
       this.refreshView();
   }
});