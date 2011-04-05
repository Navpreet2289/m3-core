/**
 * Crafted by ZIgi
 */

/*
* Эта реализация паттерна посетитель, которая позволяет используя мощь JS'а
* реализовать полиморфное поведение при обходе древовидной структуры
*/

ModelUIPresentaitionBuilder = function() {
    //Важное замечание номер раз - каждому экстовому компоненту присваевается id = id модели
    //это требуется для того чтобы ставить в соответсвие DOM элементы и экстовые компоненты
    //Важное замечание номер два - у контейнеров следует навешивать cls 'designContainer'
    //он нужен для визуального dd на форму при лукапе по DOM'у

    var mapObject =
    {
        window:function(model, cfg) {
            return new Ext.Panel(cfg);
        },
        panel:function(model, cfg) {
            return new Ext.Panel(cfg);
        },
        fieldSet:function(model, cfg) {
            return new Ext.form.FieldSet(cfg);    
        },
        textField:function(model, cfg) {
            return new Ext.form.TextField(
                    Ext.apply(cfg,{
                        readOnly:true
                    })
                );
        },
        comboBox:function(model, cfg) {
            var store = new Ext.data.ArrayStore({
            autoDestroy:true,
            idIndex:0,
            fields:['name'],
            data:['foo','bar']
        });
            var result = new Ext.form.ComboBox({
                store:store,
                displayField:'name',
                mode:'local',
                triggerAction:'all',
                editable:false,
                selectOnFocus:true,
                fieldLabel:'fukken test',
                lazyInit:false,
                value:'foo'
            });
            return result;

//            return new Ext.form.ComboBox(
//                    cfg
//                    );
        },
        tabPanel:function(model, cfg) {
            return new Ext.TabPanel(
                    Ext.apply(cfg,{
                        deferredRender:false,
                        activeTab: model.attributes.activeTabId ?
                                model.attributes.activeTabId : model.attributes.properties.activeTab,
                        listeners:{
                            tabchange:function(panel, tab) {
                                var tabPanelModel = model.ownerTree.findModelById(panel.id);
                                tabPanelModel.attributes.activeTabId = tab.id;
                            }
                        }
                    })
                );
        },
        gridPanel:function(model, cfg) {

            var store = new Ext.data.Store({
                autoDestroy:true
            });

            var columns = [];

            //поиск колонок
            for (var i = 0; i < model.childNodes.length; i++) {
                if (model.childNodes[i].attributes.type == 'gridColumn') {
                      var newColumn = new Ext.grid.Column(
                              Ext.apply({},model.childNodes[i].attributes.properties)
                              );
                      columns.push(newColumn);
                }
            }

            //если нет колонок, создадим фейк
            if (columns.length == 0) {
                columns.push({
                    id:'fake',
                    header:'Fake column',
                    dataIndex:'fake'
                });
            }

            return new Ext.grid.GridPanel( Ext.apply(cfg, {
                cls:'designContainer',
                id:model.id,
                store: store,
                colModel:new Ext.grid.ColumnModel({
                    columns:columns
                })
            }));
        }
    }

    return {
        /**
         * Возвращает ExtComponent или какой нибудь его наследник
         */
        build:function(model) {
            var cfg = Ext.apply({}, model.attributes.properties);
            cfg.id = model.id;
            if (ModelTypeLibrary.isTypeContainer(model.attributes.type)) {
                cfg.cls = 'designContainer';
            }
            if (mapObject.hasOwnProperty(model.attributes.type)) {
                return mapObject[model.attributes.type](model, cfg);
            }
        }
    }
}();