/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 * @param {Object} config
 */
Ext3.m3.ObjectGrid = Ext3.extend(Ext3.m3.GridPanel, {
	constructor: function(baseConfig, params){
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		this.readOnly = params.readOnly;
		// признак клиентского редактирования
		this.localEdit = params.localEdit;
        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;
		
		Ext3.m3.ObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext3.m3.ObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext3.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest',
            /**
             * Событие после успешного диалога добавления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат добавления (ответ сервера)
             */
            'rowadded',
            /**
             * Событие после успешного диалога редактирования записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат редактирования  (ответ сервера)
             */
            'rowedited',
            /**
             * Событие после успешного диалога удаления записи - встроенная обработка отменится при возврате false
             * @param ObjectGrid this
             * @param res - результат удаления (ответ сервера)
             */
            'rowdeleted'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		var mask = new Ext3.LoadMask(this.body),
		    params = this.getMainContext();
		params[this.rowIdName] = '';

		var req = {
			url: this.actionNewUrl,
			params: params,
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
				    try { 
				        var child_win = scope.onNewRecordWindowOpenHandler(res, opt);
				    } finally { 
    				    mask.hide();
    				    scope.disableToolbars(false);
				    }
					return child_win;
				}
				mask.hide();
				scope.disableToolbars(false);
			}
           ,failure: function(){ 
               uiAjaxFailMessage.apply(this, arguments);
               mask.hide();
               scope.disableToolbars(false);
               
           }
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;

			this.disableToolbars(true);
			mask.show();
			Ext3.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
	    	// при локальном редактировании запросим также текущую строку
			var baseConf = this.getSelectionContext(this.localEdit);
			var mask = new Ext3.LoadMask(this.body);
			var req = {
				url: this.actionEditUrl,
				params: baseConf,
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
					    try { 
						    var child_win = scope.onEditRecordWindowOpenHandler(res, opt);
						} finally { 
    						mask.hide();
    						scope.disableToolbars(false);
						}
						return child_win;
					}
					mask.hide();
                    scope.disableToolbars(false);
				}
               ,failure: function(){ 
                   uiAjaxFailMessage.apply(this, arguments);
                   mask.hide();
                   scope.disableToolbars(false);
               }
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				this.disableToolbars(true);
				mask.show();
				Ext3.Ajax.request(req);
			}
	    } else {
		Ext3.Msg.show({
			title: 'Редактирование',
			msg: 'Элемент не выбран',
			buttons: Ext3.Msg.OK,
			icon: Ext3.MessageBox.INFO
		    });
	    }
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext3.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext3.Msg.QUESTION,
		        buttons: Ext3.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = scope.getSelectionContext(scope.localEdit);
						var mask = new Ext3.LoadMask(scope.body);
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: baseConf,
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                	       try { 
		                		       var child_win =  scope.deleteOkHandler(res, opt);
		                		   } finally { 
    		                		   mask.hide();
    		                		   scope.disableToolbars(false);
    		                	   }
		                		   return child_win;
		                	   }
		                	   mask.hide();
                               scope.disableToolbars(false);
						   }
                           ,failure: function(){ 
                               uiAjaxFailMessage.apply(this, arguments);
                               mask.hide();
                               scope.disableToolbars(false);
                           }
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
						    scope.disableToolbars(true);
						    mask.show();
							Ext3.Ajax.request(req);
						}
	                }
	            }
	        });
		} else {
                    Ext3.Msg.show({
                            title: 'Удаление',
                            msg: 'Элемент не выбран',
                            buttons: Ext3.Msg.OK,
                            icon: Ext3.MessageBox.INFO
                        });
                }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,onNewRecordWindowOpenHandler: function (response, opts){
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(data){
                if (scope.fireEvent('rowadded', scope, data)) {
                    // если локальное редактирование
                    if (scope.localEdit){
                        // то на самом деле нам пришла строка грида
                        var obj = Ext3.util.JSON.decode(data);
                        var record = new Ext3.data.Record(obj.data);
                        record.json = obj.data;
                        var store = scope.getStore();
                        // и надо ее добавить в стор
                        store.add(record);
                        var sm = scope.getSelectionModel();
                        sm.selectRecords([record]);
                    } else {
                        return scope.refreshStore();
                    }
                }
			});
	    }
	}
	,onEditRecordWindowOpenHandler: function (response, opts){
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(data){
                if (scope.fireEvent('rowedited', scope, data)) {
                    // если локальное редактирование
                    if (scope.localEdit){
                        // то на самом деле нам пришла строка грида
                        var obj = Ext3.util.JSON.decode(data);
                        var record = new Ext3.data.Record(obj.data);
                        record.json = obj.data;
                        var store = scope.getStore();
                        // и надо ее заменить в сторе
                        var sm = scope.getSelectionModel();
                        if (sm.hasSelection()) {
                            var baseConf = {};
                            // пока только для режима выделения строк
                            if (sm instanceof Ext3.grid.RowSelectionModel) {
                                var rec = sm.getSelected();
                                var index = store.indexOf(rec);
                                store.remove(rec);
                                if (index < 0) {
                                    index = 0;
                                }
                                store.insert(index, record);
                                sm.selectRow(index);
                            }
                        }
                    } else {
                        return scope.refreshStore();
                    }
                }
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
        if (this.fireEvent('rowdeleted', this, response)) {
            // если локальное редактирование
            if (this.localEdit){
                // проверка на ошибки уровня приложения
                var res = Ext3.util.JSON.decode(response.responseText);
                if(!res.success){
                    smart_eval(response.responseText);
                    return;
                }
                var store = this.getStore();
                // и надо ее заменить в сторе
                var sm = this.getSelectionModel();
                if (sm.hasSelection()) {
                    // только для режима выделения строк
                    if (sm instanceof Ext3.grid.RowSelectionModel) {
                        var rec = sm.getSelections();
                        store.remove(rec);
                    }
                }
            } else {
                smart_eval(response.responseText);
                this.refreshStore();
            }
        }
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext3.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
	,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]&&!this.readOnly){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
    /**
     * Получение основного контекста грида
     * Используется при ajax запросах
     */
    ,getMainContext: function(){
    	return Ext3.applyIf({}, this.actionContextJson);
    }
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     * @param {bool} withRow Признак добавление в контекст текущей выбранной записи
     */
    ,getSelectionContext: function(withRow){
    	var baseConf = this.getMainContext();
		var sm = this.getSelectionModel();
		var record;
		// для режима выделения строк
		if (sm instanceof Ext3.grid.RowSelectionModel) {
			if (sm.singleSelect) {
				record = sm.getSelected();
				baseConf[this.rowIdName] = record.id;
			} else {
				// для множественного выделения
				var sels = sm.getSelections();
				var ids = [];
				record = [];
				for(var i = 0, len = sels.length; i < len; i++){
					record.push(sels[i]);
					ids.push(sels[i].id);
				}
				baseConf[this.rowIdName] = ids.join();
			}
		}
		// для режима выделения ячейки
		else if (sm instanceof Ext3.grid.CellSelectionModel) {
			assert(this.columnParamName, 'columnParamName is not define');
			
			var cell = sm.getSelectedCell();
			if (cell) {
				record = this.getStore().getAt(cell[0]);
				baseConf[this.rowIdName] = record.id;
				baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]);
			}
		}
		// если просят выделенную строку
        if (withRow){
        	// то нужно добавить в параметры текущую строку грида
        	if (Ext3.isArray(record)){
        		// пока х.з. что делать - возьмем первую
        		baseConf = Ext3.applyIf(baseConf, record[0].json);
        	} else {
        		baseConf = Ext3.applyIf(baseConf, record.json);
        	}
        }
		return baseConf;
    }
});

Ext3.m3.EditorObjectGrid = Ext3.extend(Ext3.m3.EditorGridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;

        // признак клиентского редактирования
      	this.localEdit = params.localEdit;

        // имя для сабмита в режиме клиентского редактирования
        this.name = params.name;
		
		Ext3.m3.EditorObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext3.m3.EditorObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext3.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var params = this.getMainContext();
		params[this.rowIdName] = '';

		var req = {
			url: this.actionNewUrl,
			params: params,
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
					return scope.childWindowOpenHandler(res, opt);
				}
			},
			failure: Ext3.emptyFn
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;
			Ext3.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = this.getSelectionContext(this.localEdit);
			var req = {
				url: this.actionEditUrl,
				params: baseConf,
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
						return scope.childWindowOpenHandler(res, opt);
					}
				},
				failure: Ext3.emptyFn
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				Ext3.Ajax.request(req);
			}
	    } else {
		Ext3.Msg.show({
			title: 'Редактирование',
			msg: 'Элемент не выбран',
			buttons: Ext3.Msg.OK,
			icon: Ext3.MessageBox.INFO
		    });
	    }
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext3.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext3.Msg.QUESTION,
		        buttons: Ext3.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = scope.getSelectionContext(scope.localEdit);
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: baseConf,
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                		   return scope.deleteOkHandler(res, opt);
		                	   }
						   },
		                   failure: Ext3.emptyFn
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
							Ext3.Ajax.request(req);
						}
	                }
	            }
	        });
		} else {
                    Ext3.Msg.show({
                            title: 'Удаление',
                            msg: 'Элемент не выбран',
                            buttons: Ext3.Msg.OK,
                            icon: Ext3.MessageBox.INFO
                        });
                }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext3.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
	/**
     * Получение основного контекста грида
     * Используется при ajax запросах
     */
    ,getMainContext: function(){
    	return Ext3.applyIf({}, this.actionContextJson);
    }
    /**
     * Получение контекста выделения строк/ячеек
     * Используется при ajax запросах
     * @param {bool} withRow Признак добавление в контекст текущей выбранной записи
     */
    ,getSelectionContext: function(withRow){
    	var baseConf = this.getMainContext();
		var sm = this.getSelectionModel();
		var record;
		// для режима выделения строк
		if (sm instanceof Ext3.grid.RowSelectionModel) {
			if (sm.singleSelect) {
				record = sm.getSelected();
				baseConf[this.rowIdName] = record.id;
			} else {
				// для множественного выделения
				var sels = sm.getSelections();
				var ids = [];
				record = [];
				for(var i = 0, len = sels.length; i < len; i++){
					record.push(sels[i]);
					ids.push(sels[i].id);
				}
				baseConf[this.rowIdName] = ids.join();
			}
		}
		// для режима выделения ячейки
		else if (sm instanceof Ext3.grid.CellSelectionModel) {
			assert(this.columnParamName, 'columnParamName is not define');
			
			var cell = sm.getSelectedCell();
			if (cell) {
				record = this.getStore().getAt(cell[0]);
				baseConf[this.rowIdName] = record.id;
				baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]);
			}
		}
		// если просят выделенную строку
        if (withRow){
        	// то нужно добавить в параметры текущую строку грида
        	if (Ext3.isArray(record)){
        		// пока х.з. что делать - возьмем первую
        		baseConf = Ext3.applyIf(baseConf, record[0].json);
        	} else {
        		baseConf = Ext3.applyIf(baseConf, record.json);
        	}
        }
		return baseConf;
    }
});