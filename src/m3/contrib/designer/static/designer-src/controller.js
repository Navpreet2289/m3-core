/**
 * Crafted by ZIgi
 */

/* Класс контроллера приложения. Является клеем между другими частями приложения.
* При создании экземпляра
* должен быть передан конфиг следующего вида:
*
* config = {
*   tree = ...,
*   container = ...,
*   toolbox = ...,
* }
*
 */

AppController = Ext.extend(Object, {
   //здесь храниться id последнего подсвеченного dom элемента
   _lastHighlightedId: undefined,

    constructor: function(config) {
       Ext.apply(this, config);
   },
   init: function(documentCfg) {
       //создаем модель
       this._model = DocumentModel.initFromJson(documentCfg);
       //создаем объекты представления модели
       this._treeView = new ComponentTreeView(this.tree, this._model);
       this._designView = new DesignView(this.designPanel, this._model);
       //синхронизируем id у панели - общего контейнера и рута модели
       //требуется для работы драг дропа с тулбокса в корень
       this._model.root.setId( this.designPanel.id);
       //создаем объект отвечающий за редактирование свойств
       this._editorManager = new PropertyEditorManager();
       //заполним тулбокс
       this._initToolbox(this.toolbox);
       //иницируем ДД с тулбокса на превью
       this._initDesignDD(this.designPanel);
       //запустим обработку мышиных событий на панели дизайнера
       this._initDesignMouseEvents(this.designPanel);

       //обработчики событий
       this.tree.on('beforenodedrop', this.onBeforeNodeDrop.createDelegate(this));
       this.tree.on('nodedrop', this.onTreeNodeDrop.createDelegate(this));
       this.tree.on('dblclick', this.onTreeNodeDblClick.createDelegate(this));
       this.tree.on('click', this.onTreeNodeClick.createDelegate(this));
       this._editorManager.on('modelUpdate', this.onModelUpdate.createDelegate(this));


       //обновим экранное представление
       this.refreshView();
   },
   _initDesignDD:function() {
       /**
        * Принцип действия драг энд дропа с тулбокса - тулбокс и превью дизайнера объеденины
        * в одну ddGroup. На DOM элемент панели дизайнера вешается Ext.dd.DropZone
        * Это класс которые перехватывает дом события и решает можно ли выполнить Drop операцию,
        * и что в ней делать если вдруг можно
        */

       //Для того чтобы понимать что в DOM дереве является контенером(читай наследник Ext.Container)
       //в который можно добавлять новый компоненты(читай Ext.Component)
       //используется фейковый CSS класс .designContainer
       //Когда создаем экстовые компоненты - незабываем навешивать эту штуку

       this.designPanel.dropZone = new Ext.dd.DropZone( this.designPanel.getEl(), {
               ddGroup:'designerDDGroup',

               // Джедайский прием. Проброс функции инстанса аппконтроллера,
               // путем создания объекта указателя на функцию со сменой объекта исполнения,
               // нужно это потому что объект который порождает дроп зону будет недоступен на момент
               // исполнения onNodeDrop. И, увы, дроп зона не наследует Observable
               // Да, чуваки, ООП в жабаскрипте это вам не хрен собачий
               processDropResults : this.domNodeDrop.createDelegate(this),
               validateDrop: this.validateDomDrop.createDelegate(this),

               getTargetFromEvent: function(e) {
                   //сюда попадают мышиные DOM события, будем пытаться найти ближайший допустимый
                   //контейнер. getTarget ищет по селектору или в текущей вершине, или в вершнах предках, но
                   //не в наследниках. Те функция вернет или null и функции ниже ничего не будут делать,
                   //или target'ом станет ближайший найденый контейнер(вернее DOM вершина которую этот конейтер
                   //олицетворяет)
                   return e.getTarget('.designContainer');
               },
               onNodeEnter: function(target, dd, e, data) {
                   Ext.fly(target).addClass('selectedElement');
               },
               onNodeOut:function(target, dd, e, data){
                   Ext.fly(target).removeClass('selectedElement');
               },
               onNodeOver:function(target, dd, e, data) {
                   //здесь штука чтобы показать значок 'Можно дропать' на экране
                   return this.validateDrop(target, dd, e, data) ? Ext.dd.DropZone.prototype.dropAllowed:
                           Ext.dd.DropZone.prototype.dropNotAllowed;
               },
               onNodeDrop:function(target, dd, e, data) {
                   this.processDropResults(target, dd, e, data);
               }
           });
   },
   /*
   * Вешаемся на клики по панели. При ординарном щелчке подсвечиваем ближайший редактируемый элемент
   * При двойном открываем окно редактирования
   */
   _initDesignMouseEvents: function(panel) {
       var el = panel.getEl();
       el.on('dblclick', this.onDomDblClick.createDelegate(this));
       el.on('click', this.onDomClick.createDelegate(this));
   },
   /*
   * Заполняем тулбокс компонентами
   */
   _initToolbox:function(toolbox) {
            var root = toolbox.getRootNode();
            root.appendChild(ModelTypeLibrary.getToolboxData() );
   },
   /*
    * Подствека в превью дизайнера компонента для элемента с id
    */
   highlightElement:function(id) {
       this.removeHighlight();
       var flyEl = Ext.fly(id);
       if (flyEl) {
           flyEl.addClass('selectedElement');
           this._lastHighlightedId = id;
       }
   },
   /*
    * Убрать подстветку
    */
   removeHighlight:function() {
       if (!Ext.isEmpty(this._lastHighlightedId)) {
           var flyEl = Ext.fly(this._lastHighlightedId);
           if (flyEl) {
               flyEl.removeClass('selectedElement');
           }
           else {
               //ситуация когда подсветка была на элемента, который удалили
               this._lastHighlightedId = undefined;
           }
       }  
   },
    /*
    * Просто все перерисовываем
    */
   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },

   /*
    * Обработка дропа на деверева компонентов. Параметры две TreeNode и строка с положеним относитнльно
    * друг друга
    */
   moveTreeNode:function(drop, target, point) {
        var sourceModel = this._model.findModelById(drop.attributes.id);
        var targetModel = this._model.findModelById(target.attributes.id);

       //Изменение положения ноды это фактически две операции - удаление и аппенд к новому родителю
       //поэтому прежде чем двигать отключим обновление UI, так как иначе получим js ошибки при перерисовке
       //дерева в неподходящий момент внутри treeSorter'а

       //TODO похоже баг при сортировке не исправлен! Надо попробовать двигать в beforeDrop или на колбэке к нему

       this.removeHighlight();

       this._treeView.suspendModelListening();
       this._designView.suspendModelListening();

       this._moveModelComponent(sourceModel, targetModel, point);

       this.refreshView();

       this._treeView.resumeModelListening();
       this._designView.resumeModelListening();

       return false;
   },
   /*
    * Перемещение моделей в дереве документа
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
   * Обработка дропа в дизайнер с тулбокса
   */
   domNodeDrop:function(target, dd, e, data ) {
       this.removeHighlight();
       var componentNode = data.node;
       var model = this._model.findModelById(target.id);

       if (!model.checkRestrictions(componentNode.attributes.type)) {
           return;
       }

       var newModelNodeConfig = {};
       newModelNodeConfig.properties = ModelTypeLibrary.getTypeInitProperties(componentNode.attributes.type);
       var nameIndex = this._model.countModelsByType(componentNode.attributes.type);
       newModelNodeConfig.properties.id = newModelNodeConfig.properties.id + '_' + (nameIndex+1) ;
       newModelNodeConfig.type = componentNode.attributes.type;
       model.appendChild( new ComponentModel(newModelNodeConfig) );
   },
   validateDomDrop:function(target, dd, e, data) {
       var parent = this._model.findModelById(target.id);
       var child = data.node.attributes.type;
       return parent.checkRestrictions(child);
   },
   /*
   * Возвращает объект для отправки на сервер
   */
   getTransferObject:function() {
       return ModelUtils.buildTransferObject(this._model);
   },
   onDomDblClick: function(event, target, obj) {
       var el = event.getTarget('.designComponent');
       if (el) {
           var model = this._model.findModelById(el.id);
           this._editorManager.editModel(model);
       }
   },
   onDomClick: function(event, target, obj) {
       var el = event.getTarget('.designComponent');
       if (el) {
           this.highlightElement(el.id);
       }
   },
   onTreeNodeClick:function(node, e) {
       this.highlightElement(node.id);
   },
   onBeforeNodeDrop:function(dropEvent) {
        if (dropEvent.target.isRoot) {
            //рут не отображается, и в него нельзя перетаскивать
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