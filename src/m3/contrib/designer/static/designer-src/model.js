/**
 * Crafted by ZIgi
 */

/**
 *  ��������� ������ ������������� ��������� ���������. ��� �������� ����������
 * ����������� �� ������� Ext.data.Tree � Ext.data.Node, ��������������� ��� ����������� �������
 * ������ � ������� � ��� ���������.
 */

ComponentModel = Ext.extend(Ext.data.Node, {
    constructor: function(config) {
        this.type = config.type || 'undefined';
        ComponentModel.superclass.constructor.call(this,config);
    },
    isContainer: function() {
        return ModelTypeLibrary.isTypeContainer(this.attributes.type);
    }
});

DocumentModel = Ext.extend(Ext.data.Tree, {
    deletedItemsBag:[],//����� ��������� ��������� ������������� ����������
    constructor:function(root) {
        DocumentModel.superclass.constructor.call(this, root);
        this.on('remove', this._onRemove);
    },
    /**
     * ����� ������ �� id. ��� ������ ����� � �������. ����� ���� � ���������� ����� �����������
     * �� �������� nodeHash ������ ������ � ��� ������������ ��� ������ �� id(�� ��� ���� ��, ������� ���������)
     */
    findModelById:function(id) {
        if (this.root.id == id ){
            return this.root;
        }
        return this.root.findChild('id',id, true);
    },
    /**
     * ��������� ��������� items ������ � ������������ � orderIndex ����������
     */
    initOrderIndexes:function() {
        var sortFn = function(node1, node2) {
            if (node1.attributes.orderIndex > node2.attributes.orderIndex ) {
                return 1;
            }
            else if (node1.attributes.orderIndex == node2.attributes.orderIndex) {
                return 0;
            }
            else if (node1.attributes.orderIndex < node2.attributes.orderIndex) {
                return -1;
            }
        };

        this.root.cascade(function(node){
            node.sort( sortFn );
        } );

        //������� �� ������� ��������� � ������ � ��������� orderIndex.
        //�� ��� ����� ��� �������� �� ������� �������
        //������� ������������ ����������� �� �����
        this.on('append', function(tree, self, node, index) {
            node.attributes.orderIndex = index;
        } );
        this.on('move', function(tree, self, oldParent, newParent, index ) {
            self.attributes.orderIndex = index ;
        });
        this.on('remove', function(tree, parent, node) {
            var next  = node.nextSibling;
            while(next) {
                next.attributes.orderIndex--;
                next = next.nextSibling;
            }
        });
        this.on('insert', function(tree, parent, node, refNode) {
            node.attributes.orderIndex = refNode.attributes.orderIndex;
            var next = node.nextSibling;
            while (next) {
                next.attributes.orderIndex++;
                next = next.nextSibling;
            }
        });
    },
    /*
    * ���������� ��� �������� ��������� ����������
     */
    _onRemove:function(tree, parent, node) {
        //����� ��������� ������ �� ����������, ��� ���������� �� �������
        //� ������� ����� �������� ������ ������, �� ���� �������� ��� ������ ComponentModel
        //�� ����� �������� remove �� ���� ����� �������� �������� ��������
        if (node.attributes.serverId) {
            var doRecursion = function(item) {
                var newNode = {
                    id:item.attributes.id,
                    type:item.attributes.type
                };

                if (item.isContainer()) {
                    newNode.items = [];
                    for (var i=0;i<item.childNodes.length;i++) {
                        newNode.items.push(doRecursion(item.childNodes[i]))
                    }
                }
                return newNode;
            };

            var item = doRecursion(node);
            this.deletedItemsBag.push(item);
        }
    }
});

/**
 * "�����������" ������ - �� json ������������� � ������� ������ ����������� ������
 * @param jsonObj - �������������� ������
 */
DocumentModel._cleanConfig = function(jsonObj) {
    //�������� items �� �������. �������� id ������������ �������� serverId,
    //�� ������ js ��� ������������ ���������� id'�����
    var config = Ext.apply({}, jsonObj);
    Ext.destroyMembers(config, 'items');
    if (jsonObj.hasOwnProperty('id')) {
        config.serverId = jsonObj.id;
    }
    return config;
};

DocumentModel.initFromJson = function(jsonObj) {
    //������� json ������ � ����� ������������� ������ � ������, ��������� � ����
    var root = new ComponentModel(DocumentModel._cleanConfig(jsonObj));

    var callBack = function(node, jsonObj) {
        var newNode = new ComponentModel(DocumentModel._cleanConfig(jsonObj));
        node.appendChild(newNode);
        if (!jsonObj.items)
            return;
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(newNode, jsonObj.items[i])
        }
    };

    if (jsonObj.items) {
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(root, jsonObj.items[i])
        }
    }

    var result = new DocumentModel(root);
    result.initOrderIndexes();
    return result;
};