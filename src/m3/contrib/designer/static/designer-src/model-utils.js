/**
 * Crafted by ZIgi
 */

/**
 * ������ �������� � ���� ����� ��������� ������� ��� �������������� ������ �� ���-�� ������
 */
ModelUtils = Ext.apply(Object,{
    /**
     * ���������� ExtComponent ��� ����� ������ ��� ���������
     */
    buildExtUIComponent:function(model) {
        //������ ��������� ����� ��� - ������� ��������� ���������� ������������� id = id ������
        //��� ��������� ��� ���� ����� ������� � ����������� DOM �������� � �������� ����������
        //������ ��������� ����� ��� - � ����������� ������� ���������� cls 'designContainer'
        //�� ����� ��� ����������� dd �� ����� ��� ������ �� DOM'�
        switch(model.attributes.type)
            {
                case 'panel':
                    return new Ext.Panel({
                            title:model.attributes.title,
                            layout:model.attributes.layout,
                            cls:'designContainer',
                            id:model.id
                    });

                break;

                case 'window':
                    return new Ext.Panel({
                            title:model.attributes.title,
                            layout:model.attributes.layout,
                            cls:'designContainer',
                            id:model.id
                    });

                break;

                case 'textField':
                    return new Ext.form.TextField({
                        fieldLabel:model.attributes.fieldLabel,
                        anchor:model.attributes.anchor,
                        id:model.id,
                        readOnly:true
                    });
                break;

                case 'tabPanel':
                    return new Ext.TabPanel({
                        id:model.id,
                        deferredRender:false,
                        activeTab:model.attributes.activeTab,
                        title:model.attributes.title,
                        cls:'designContainer'
                    });
                break;
            }
    },
    /**
     * ���������� TreeNode �� ������
     */
    buildTreeNode:function(model) {
        //����� �� ������ ��������� - id ���� � ������ ���������� �� ������ � id �������� ����� ���� �����
        var iconCls = ModelTypeLibrary.getTypeIconCls(model.attributes.type);
            return new Ext.tree.TreeNode({
                name:model.attributes.name,
                modelObj:model,
                id:model.id,
                expanded:true,
                allowDrop:model.isContainer(),
                orderIndex:model.attributes.orderIndex+'' || '0',
                iconCls: iconCls
            });
    },
    /*
    * �������������� ������ ������ ��� �������� �� ������. ������ �������� ��������� �������:
    * {
    *   model:{ //���� ������
     *      id:507, //��� ��������� id, ��� 0 ��� ����� �����������
    *       type:'document',
    *       name:'fofofo',
    *       items:[]
    *   },
    *   deletedModels:[
    *       {
    *           id:508,
    *           type:'date',
    *           name:'Bla-bla'
    *       }
    *   ] //����� ��������� ������ � ��������� �����������
    * }
    */
    buildTransferObject:function(model){
        var result = {};
        var prepareId = function(dataObject){
            dataObject.id = dataObject.serverId ? dataObject.serverId : 0;
        };

        var doRecursion = function(model) {
            var node = Ext.apply({}, model.attributes);
            prepareId(node);
            if (model.hasChildNodes()) {
                node.items = [];
                for (var i = 0; i < model.childNodes.length; i++){
                    node.items.push( doRecursion(model.childNodes[i]) );
                }
            }
            return node;
        };

        result.model = doRecursion(model.root);

        result.deletedModels = model.deletedItemsBag;
        return result;
    }
});