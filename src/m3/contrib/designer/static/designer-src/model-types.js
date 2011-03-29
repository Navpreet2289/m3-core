/**
 * Crafted by ZIgi
 */

ModelTypeLibrary = Ext.apply(Object, {
    typesConfig:{
        panel:{
            isContainer:true,
            properties:{
                layout:{
                    defaultValue:'auto'
                },
                title:{
                    defaultValue:'New panel'
                },
                name:{
                    defaultValue:'New panel'
                },
                height:{
                    defaultValue:'auto'
                },
                width:{
                    defaultValue:'auto'
                },
                flex:{
                    defaultValue:0
                }
            },
            toolboxData:{
                text:'Panel'
            },
            treeIconCls:'icon-heart'
        },
        tabPanel:{
            isContainer:true,
            properties:{
                title:{
                    defaultValue:'New tab panel'
                },
                name:{
                    defaultValue:'New tab panel'
                },
                activeTab:{
                    defaultValue:0
                }
            },
            toolboxData:{
                text:'Tab panel'
            },
            treeIconCls:'icon-heart'
        },
        textField:{
            properties:{
                fieldLabel:{
                    defaultValue:''
                },
                name:{
                    defaultValue:'New text field'
                }
            },
            toolboxData:{
                text:'Text field'
            },
            treeIconCls:'designer-icon-text'
        },
        window:{
            properties: {
                name:{
                    allowBlank:false,
                    defaultValue:'Ext window'
                },
                layout:{
                    defaultValue:'fit'
                },
                title: {
                    defaultValue:'New window'
                }
            },
            isContainer:true,
            treeIconCls:'designer-icon-page'
        }
    },
    /**
     * ���������� ������ �� ���������� ����������� ���������� ���������� �� ���� ������
     *
     */
    getTypeDefaultProperties:function(type) {
        //��������� ��� ��� ��� �� ������ ����� - � js ������� � ������������� �������(�������) ���� � ����
        //� ����� ����, � ������� ����� for ����� ����������� �� ��������� �������(����� - �������� ��� ����� �������)
        var currentType = this.typesConfig[type]['properties'];
        var cfg = {};
        for (var i in currentType) {
            cfg[i] = currentType[i]['defaultValue'];
        }
        return cfg;
    },
    /**
     * ���������� ����� ������ ��� ����������� ����
     */
    getTypeIconCls:function(type) {
        return this.typesConfig[type]['treeIconCls'];
    },
    /**
     * ������ �������� �������� �� ��� �����������
     */
    isTypeContainer:function(type) {
        return this.typesConfig[type].isContainer ? true : false;
    },
    /*
     * ����� ���������� ������ ExtTreeNode ��� ����������� � ��������
     */
    getToolboxData:function() {
        var result = [];
        for (var type in this.typesConfig){
           if (!this.typesConfig[type].hasOwnProperty('toolboxData')) {
                continue;
           };
           var node = new Ext.tree.TreeNode({
               name:this.typesConfig[type]['toolboxData'].text,
               type:type,
               iconCls:this.typesConfig[type]['treeIconCls']
           });
            result.push(node);
        }
        return result;
    }
});
