String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

Ext.ns('Ext.ux.grid');
Ext.ux.grid.MultiGrouping = function(config) {
	if (config) Ext.apply(this, config);
}
/**
 * Плагин для LiveGrid, работающий с группировкой столбцов
 */
Ext.extend(Ext.ux.grid.MultiGrouping, Ext.util.Observable, {
	/**
	 * Заголовок в панели с полями, по которым установлена группировка
	 */
    title: "Порядок группировки:",
    /**
	 * Заголовок и идентификатор поля в котором отображается группировка
	 */
    groupFieldTitle: "Группировка",
    groupFieldId: "grouping",
    /**
     * Идентификатор поля в Store в котором содержатся идентификаторы записей (используется для разворачивания)
     */
    dataIdField: "id",
    /**
     * Идентификатор поля в Store в котором содержатся отображаемые идентификаторы сгруппированных записей (используется для разворачивания)
     * Например, вместо id учреждения будет отображаться его название, или вместо true будет писаться Да
     */
    dataDisplayField: "id",
	/**
     * Развернутые элементы верхнего уровня.
     * Элемент представляет собой объект вида:
     * {index: 0, id: 0, count: 0, expandedItems:[]}
     * где	index - порядковый номер развернутого элемента во всем раскрытом дереве/гриде
     * 		id - идентификатор развернутого элемента
     * 		count - количество дочерних элементов, включая все развернутые элементы нижних уровней
     * 		expandedItems - развернутые элементы аналогичной структуры внутри текущего элемента
     */
	expandedItems: [],
	/**
	 * Перечень колонок, по которым производится группировка.
	 * Если пусто, то нет группировки.
	 */
	groupedColumns: [],
	/**
     * Инициализация плагина
     *
     * @param {Ext.grid.GridPanel} grid Собственно грид
     */
	init: function(grid) {
        if(grid instanceof Ext.grid.GridPanel){
        	this.grid = grid;
        	this.grid.loadMask = false; // не будем показывать стандартную маску - у нас есть своя
            this.cm = this.grid.getColumnModel();
            // добавим новый столбец, в котором будет отображаться группировка (если она будет)
            this.grouppingColumn = new Ext.grid.Column({header: this.groupFieldTitle, id: this.groupFieldId, width: 160, renderer: {fn:this.groupRenderer, scope: this}});
            var cmConfig = [this.grouppingColumn].concat(this.cm.config); 
            this.cm.setConfig(cmConfig);            
            this.grouppingColumn.hidden=!(this.groupedColumns.length>0);

            // повесимся на клик, чтобы раскрывать/скрывать уровни группировки
            this.grid.on('click', this.onNodeClick, this);
            // повесимся на событие загрузки данных в грид, чтобы проставить им свои характеристики
            // событие 'load' сработает только один раз при начальной загрузке
            this.grid.view.on('buffer', this.onLoadData, this);
            this.grid.store.on('load', this.onLoad, this);
            // повесимся на момент загрузки данных, чтобы передавать текущие параметры загрузки
            this.grid.view.on('beforebuffer', this.onBeforeBuffer, this);
            this.grid.store.on('beforeload', this.onBeforeLoad, this);
            this.grid.grouper = this;
            // обработка клавиш PgUp и PgDown
            this.grid.on('keypress', this.onKeyPress, this);

            grid.on('afterrender',this.onRender,this);

            var reorderer = new Ext.ux.ToolbarReorderer({
                owner:this,
                createItemDD: function(button) {
                    if (button.dd != undefined) {
                        return;
                    }
                    
                    var el   = button.getEl(),
                        id   = el.id,
                        tbar = this.target,
                        me   = this;
                    
                    button.dd = new Ext.dd.DD(el, undefined, {
                        isTarget: true
                    });
                    
                    //if a button has a menu, it is disabled while dragging with this function
                    var menuDisabler = function() {
                        return false;
                    };
                    
                    Ext.apply(button.dd, {
                        owner:this,
                        b4StartDrag: function() {       
                            this.startPosition = el.getXY();
                            
                            //bump up the z index of the button being dragged but keep a reference to the original
                            this.startZIndex = el.getStyle('zIndex');
                            el.setStyle('zIndex', 1000000);
                            
                            button.suspendEvents();
                            if (button.menu) {
                                button.menu.on('beforeshow', menuDisabler, me);
                            }

                        },
                        
                        startDrag: function() {
                            this.constrainTo(tbar.getEl());
                            tbar_height = tbar.getHeight();
                            this.setYConstraint(tbar_height,tbar_height,tbar_height);

                        },
                        
                        onDrag: function(e) {
                            //calculate the button's index within the toolbar and its current midpoint
                            var buttonX  = el.getXY()[0],
                                deltaX   = buttonX - this.startPosition[0],
                                items    = tbar.items.items,
                                oldIndex = items.indexOf(button),
                                newIndex;


                            //find which item in the toolbar the midpoint is currently over
                            for (var index = 0; index < items.length; index++) {
                                var item = items[index];
                                
                                if (item.reorderable && item.id != button.id) {
                                    //find the midpoint of the button
                                    var box        = item.getEl().getBox(),
                                        midpoint   = (me.buttonXCache[item.id] || box.x) + (box.width / 2),
                                        movedLeft  = oldIndex > index && deltaX < 0 && buttonX < midpoint,
                                        movedRight = oldIndex < index && deltaX > 0 && (buttonX + el.getWidth()) > midpoint;
                                    
                                    if (movedLeft || movedRight) {
                                        me[movedLeft ? 'onMovedLeft' : 'onMovedRight'](button, index, oldIndex);
                                        break;
                                    }                        
                                }
                            }
                        },
                        
                        /**
                         * After the drag has been completed, make sure the button being dragged makes it back to
                         * the correct location and resets its z index
                         */
                        endDrag: function() {
                            //we need to update the cache here for cases where the button was dragged but its
                            //position in the toolbar did not change
                            me.updateButtonXCache();

                            tbar_box = tbar.getEl().getBox();
                            el_y = el.getY();
                            if (el_y<tbar_box.y | el_y>tbar_box.y + tbar_box.height){
                                this.owner.owner.deleteGroupingButton(button);
                            }
                            else{
                            
                            el.moveTo(me.buttonXCache[button.id], el.getY(), {
                                duration: me.animationDuration,
                                scope   : this,
                                callback: function() {
                                    button.resumeEvents();
                                    if (button.menu) {
                                        button.menu.un('beforeshow', menuDisabler, me);
                                    }
                                    
                                    tbar.fireEvent('reordered', button, tbar);
                                }
                            });
                            
                            el.setStyle('zIndex', this.startZIndex);
                        }
                        }
                    });
                },
                
                onMovedLeft: function(item, newIndex, oldIndex) {
                    var tbar  = this.target,
                        items = tbar.items.items;
                    
                    if (newIndex != undefined && newIndex != oldIndex) {
                        //move the button currently under drag to its new location
                        tbar.remove(item, false);
                        tbar.insert(newIndex, item);
                        
                        //set the correct x location of each item in the toolbar
                        this.updateButtonXCache();
                        for (var index = 0; index < items.length; index++) {
                            var obj  = items[index],
                                newX = this.buttonXCache[obj.id];
                            
                            if (item == obj) {
                                item.dd.startPosition[0] = newX;
                            } else {
                                var el = obj.getEl();
                                
                                el.moveTo(newX, el.getY(), {duration: this.animationDuration});
                            }
                        }
                    }
                },
                
                onMovedRight: function(item, newIndex, oldIndex) {
                    this.onMovedLeft.apply(this, arguments);
                }

            });
            this.droppable = new Ext.ux.ToolbarDroppable({
                /**
                 * Создание нового элемента по событию дропа на панель
                 */
                owner:this,
                /**
                 * переопределил функцию просчета позиции для новый элементов
                 * иначе неправльно добавлялись кирилические столбцы
                 */
                calculateEntryIndex: function(e) {
                    return -1;
                },
                createItem: function(data) {
                    var column = this.getColumnFromDragDrop(data);
                    
                    return this.owner.createGroupingButton({
                        text    : column.header,
                        groupingData: {
                            field: column.dataIndex
                        }
                    });
                },

                /**
                 * Переопределим метод для определения можно ли кидать колонку на тулбар
                 * @param {Object} data Данные объекта который дропают
                 * @return {Boolean} True если можно дропнуть
                 */
                canDrop: function(dragSource, ev, data) {
                    var group_columns = this.owner.getGroupColumns(),
                        column  = this.getColumnFromDragDrop(data);
                    
                    if (!column.groupable) return false


                    for (var i=0; i < group_columns.length; i++) {
                        if (group_columns[i] == column.dataIndex) return false;
                    }

                    return true;
                },
                
                afterLayout: function(){
                    this.owner.doGroup(this.owner.getGroupColumns())
                    //скрываем дефолтные курсоры перемещения столбцов
                    this.owner.grid.view.columnDrop.proxyTop.hide();
                    this.owner.grid.view.columnDrop.proxyBottom.hide();
                },

                /**
                 * Вспомогательная функция для поиска колонки которую дропнули
                 * @param {Object} data Данные
                 */
                getColumnFromDragDrop: function(data) {
                    var index    = data.header.cellIndex,
                        colModel = grid.colModel,
                        column   = colModel.getColumnById(colModel.getColumnId(index));
                    return column;
                }
            });
            // настроим первоначальную группировку
            var toolItems = [this.title];
            if (this.groupedColumns.length > 0) {
            	for (var colInd = 0; colInd < this.groupedColumns.length; colInd++) {
            		var colName = this.groupedColumns[colInd];
            		var colText = this.grid.colModel.getColumnHeader(this.grid.colModel.findColumnIndex(colName));
            		var butt = this.createGroupingButton({
                        text    : colText,
                        groupingData: {
                            field: colName
                        }
                    });
                    toolItems.push(butt);
            	};
            };
            toolItems.push('-');
            this.tbar = new Ext.Toolbar({
                items  : toolItems,
                plugins: [reorderer, this.droppable],
                listeners: {
                    scope    : this,
                    reordered: this.changeGroupingOrder
                }
            });
            this.expandedItems = [];
        }
	},
	/**
     * Щелчок по гриду. Будем ловить раскрытие/закрытие групп
     *
     * @param {Ext.EventObject} e Параметры события
     */
	onNodeClick: function (e) {
		// будем обрабатывать только если включена группировка
		if (this.groupedColumns.length > 0) {
			var target = e.getTarget();
			// найдем объект по которому щелкнули
			var obj = Ext.fly(target);
			var colInd = this.grid.view.findCellIndex(target);
			var rowInd = this.grid.view.findRowIndex(target);
			if (rowInd >= 0 && colInd !== false) {
				var col = this.grid.colModel.getColumnAt(colInd);
				if (this.grouppingColumn.id == col.id) {
					var row = this.grid.store.getAt(rowInd);
					// если это кнопки группировки, то переключим их
					if (row._expanded) {
						obj.removeClass('x-tree-elbow-minus');
				        obj.addClass('x-tree-elbow-plus');
				        this.collapseItem(rowInd);
					} else {
						obj.removeClass('x-tree-elbow-plus');
				        obj.addClass('x-tree-elbow-minus');
				        this.expandItem(rowInd);
					}
				}
			}
		}
	},
	/**
	 * Получение списка сгруппированных полей на панели 
	 */
    getGroupColumns:function() {
        var columns = [];

        if (this.tbar)
            Ext.each(this.tbar.findByType('button'), function(button) {
                if (button.groupingData)
                    columns.push(button.groupingData.field);
            }, this);
        
        return columns;
    },
    /**
     * Событие изменения порядка группировки
     */
    changeGroupingOrder: function() {
    	this.doGroup(this.getGroupColumns());
    },
    /**
     * Создание кнопки поля группировки
     * 
     * @param {Object} config Параметры кнопки
     */
    createGroupingButton:function(config) {
        config = config || {};
        Ext.applyIf(config, {
            owner: this,
            listeners: {
                scope: this,
                click: function(button, e) {
                    //пустышка для обработки нажатия на кнопку
                }
            },
            reorderable: true
        });
        return new Ext.Button(config);
    },
    /**
     * Событие удаления кнопки поля группировки
     * 
     * @param {Ext.Button} button Кнопка, которую удаляют
     */
    deleteGroupingButton:function(button){
        button.destroy();
        this.doGroup(this.getGroupColumns()) 
    },
    /**
     * Событие отрисовки панели группировки
     */
    onRender: function(){
        this.grid.elements +=',tbar';
        this.grid.tbar = this.tbar
        this.grid.add(this.tbar);
        this.grid.groupingToolBar = this.tbar;
    	this.grid.doLayout();
        this.grid.enableDragDrop = true;

        var dragProxy = this.grid.getView().columnDrag,
            ddGroup   = dragProxy.ddGroup;
        this.droppable.addDDGroup(ddGroup);
    },
	/**
     * Отрисовщик колонки группировки.
     *
     * @param {Object} v Отображаемое значение
     * @param {Object} p Атрибуты колонки (css, attr...)
     * @param {Ext.data.record} record Отрисовываемая запись данных
     * @param {Number} rowIndex Индекс строки
     * @param {Number} colIndex Индекс колонки
     * @param {Ext.data.Store} st Набор данных
     */
	groupRenderer: function (v, p, record, rowIndex, colIndex, st) {
		var res = '';
		p.css += 'x-tree-no-lines';
		var is_leaf = record.json.is_leaf;
		if (!is_leaf) {
			var expanded = record._expanded;
			var indent = record.json.indent;
			var indent_str = "&#160;".repeat(indent*6);
			var column = this.groupedColumns[indent];
			var count = record.json.count;
			v = record.json[this.dataDisplayField];
			var col_name = this.grid.colModel.getColumnHeader(this.grid.colModel.findColumnIndex(column));
			// Различия для браузеров в отрисовке иконок разворачивания узла. Быть может можно привести к более общему формату, но разбираться пока времени нет
			if (Ext.isIE6 || Ext.isIE7) {
				res = String.format('<b style="cursor:pointer"><div class="x-tree-elbow-{0}" style="position:absolute;left:{5}px;margin-top:-3px"></div>{2}{3}: {1} ({4})</b>',expanded ? 'minus':'plus', v, indent_str, col_name, count, indent*18);
			} else {
				res = String.format('<b style="cursor:pointer"><span>{2}</span><span class="x-tree-elbow-{0}" style="margin-left:-18px;padding-left:18px;left:{5}px;padding-top:3px"></span>{3}: {1} ({4})</b>',expanded ? 'minus':'plus', v, indent_str, col_name, count, indent*18);
			}
		}
		return res;
	},
	/**
	 * Успешная загрузка данных в буфер. Отправим ее на общую обработку
	 * 
	 * @param {Ext.ux.BufferedGridView} view
	 * @param {Ext.data.Store} store Набор данных
	 * @param {Number} rowIndex Индекс строки
	 * @param {Number} min
	 * @param {Number} totalLen Общий объем данных доступных для загрузки
	 * @param {Object} opts Параменты запроса данных
	 */
	onLoadData: function (view, st, rowIndex, min, totalLen, opts) {
		this.onLoad(st);
	},
	/**
	 * Первоначальная загрузка набора записей. Сделаем первичную обработку.
	 * 
	 * @param {Ext.data.Store} st Набор данных
	 */
	onLoad: function (st) {
		this.expanding = null;
		if (this.groupedColumns.length > 0) {
			for (var i = st.bufferRange[0]; i <= st.bufferRange[1]; i++) {
				//var record = st.data.itemAt(i);
				var record = st.getAt(i);
				if (record != null) {
					//record._expanded = this.isExpanded(i);
					record._expanded = record.json.expanded;
				}
	        }
		}
	},
	/**
	 * Перед загрузкой выставим параметры загрузки
	 * 
	 * @param {Ext.ux.BufferedGridView} view
	 * @param {Ext.data.Store} store Набор данных
	 * @param {Number} rowIndex Индекс строки
	 * @param {Number} min
	 * @param {Number} totalLen Общий объем данных доступных для загрузки
	 * @param {Object} opts Параменты запроса данных
	 */
	onBeforeBuffer: function (view, st, rowIndex, min, totalLen, opts) {
		this.onBeforeLoad(st, opts);
	},
	onBeforeLoad: function (st, opts) {
		this.grid.view.showLoadMask(true);
		var expanding = this.expanding;
		var exp_par = Ext.util.JSON.encode(this.expandedItems);
		var group_par = Ext.util.JSON.encode(this.groupedColumns);
		opts.params.expanding = expanding;
		opts.params.exp = exp_par;
		opts.params.grouped = group_par;
	},
	/**
	 * Поиск набора раскрытых элементов по ключевым значениям
	 * 
	 * @param {Array} keys массив ключевых значений в порядке сгруппированных полей
	 */
	findExpandedItem: function(keys) {
		var expItems = this.expandedItems;
		for (var i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			for (var j = 0, explen = expItems.length; j < explen; j++) {
				var item = expItems[j];
				if (item.id == key){
					expItems = item.expandedItems;
					break;
				}
			}
		}
		return expItems;
	},
	/**
	 * Раскрытие элемента с перечитыванием данных
	 * 
	 * @param {Number} rowIndex номер записи
	 */
	expandItem: function (rowIndex) {
		if (this.groupedColumns.length > 0) {
			var row = this.grid.store.getAt(rowIndex);
			if (!row._expanded) {
		        row._expanded = true;
		        var obj = {index: row.json.lindex, id: row.data[this.dataIdField], count: -1, expandedItems:[]};
		        // нужно также учесть уровень, на котором располагается элемент
		        var level = row.json.indent;
		        // сформируем набор ключевых значений, чтобы узнать родительский раскрытый узел
		        var keys = [];
		        for (var i = 0; i < level; i++){
		        	var col = this.groupedColumns[i];
		        	var key = row.get(col);
		        	keys.push(key);
		        }
		        // теперь найдем развернутый элемент уровеня на котором нужно вставить раскрытый элемент
		        var expItems = this.findExpandedItem(keys);
		        var added = false;
		        // необходимо найти место для вставки новой записи о раскрытии
		        for (var i = 0, len = expItems.length; i < len; i++) {
		        	var ei = expItems[i];
		        	if (ei.index > row.json.lindex) {
		        		// вставить перед ei и прекратить
		        		if (i > 0) {
		        			var new_gc = expItems.splice(i);
		        			expItems.push(obj);
		        			for (var k = 0, klen = new_gc.length;k < klen;k++){
		        				expItems.push(new_gc[k]);
		        			}
		        		} else {
		        			expItems.unshift(obj);
		        		}
		        		added = true;
		        		break;
		        	}
		        }
		        if (!added) {
		        	expItems.push(obj);
		        }
		        this.expanding = rowIndex;
				// перезагрузка грида
		        this.grid.view.showLoadMask(true);
				this.grid.view.updateLiveRows(rowIndex,true,true);
			}
		}
	},
	/**
	 * Сворачивание элемента с перечитыванием данных
	 * 
	 * @param {Number} rowIndex номер записи
	 */
	collapseItem: function (rowIndex) {
		if (this.groupedColumns.length > 0) {
			var row = this.grid.store.getAt(rowIndex);
			if (row._expanded) {
		        row._expanded = false;
		        // нужно также учесть уровень, на котором располагается элемент
		        var level = row.json.indent;
		        // сформируем набор ключевых значений, чтобы узнать родительский раскрытый узел
		        var keys = [];
		        for (var i = 0; i < level; i++){
		        	var col = this.groupedColumns[i];
		        	var key = row.get(col);
		        	keys.push(key);
		        }
		        // теперь найдем развернутый элемент уровеня на котором нужно ужалить раскрытый элемент
		        var expItems = this.findExpandedItem(keys);
		        for (var i = 0, len = expItems.length; i < len; i++) {
		        	var exp = expItems[i];
		        	if (exp.index == row.json.lindex){
		        		expItems.splice(i,1);
		        		// перезагрузим грид
		        		this.grid.view.showLoadMask(true);
		        		this.grid.view.updateLiveRows(rowIndex,true,true);
		        		break;
		        	}
		        }
			}
		}
	},
	/**
	 * Установка группировочных колонок
	 * 
	 * @param {Array} columns Список колонок для группировки
	 */
    doGroup: function (columns) {
    	this.grid.colModel.setHidden(0, !(columns.length > 0));
        this.expandedItems = [];
        this.groupedColumns = columns;
        this.grid.view.reset(true);
    },
	/**
	 * 
	 * @param {Ext.EventObject} e Параметры события нажатия клавиши
	 */
    onKeyPress: function (e) {
    	if (e.keyCode == e.PAGEUP) {
    		if (this.rowHeight == -1) {
                e.stopEvent();
                return;
            }
    		var d = this.grid.view.visibleRows-1;
    		if (this.grid.view.rowIndex-d < 0) {
            	d = this.grid.view.rowIndex;
            }
            this.grid.view.adjustScrollerPos(-(d*this.grid.view.rowHeight),true);
            this.grid.view.focusEl.focus();
            this.grid.getSelectionModel().selectRow(this.grid.view.rowIndex-d);
    		e.stopEvent();
    		}
    	if (e.keyCode == e.PAGEDOWN) { 
    		if (this.rowHeight == -1) {
                e.stopEvent();
                return;
            }
    		var d = this.grid.view.visibleRows-1;
    		if (this.grid.view.rowIndex+d > this.grid.store.totalLength) {
    			d = this.grid.store.totalLength-this.grid.view.rowIndex-1;
    		}
            this.grid.view.adjustScrollerPos((d*this.grid.view.rowHeight),true);
            this.grid.view.focusEl.focus();
            this.grid.getSelectionModel().selectRow(this.grid.view.rowIndex+d);
    		e.stopEvent();
    		}
    	if (e.keyCode == e.HOME) {
    		this.grid.view.adjustScrollerPos(-(this.grid.view.rowIndex*this.grid.view.rowHeight),true);
            this.grid.view.focusEl.focus();
            this.grid.getSelectionModel().selectRow(0);
    		e.stopEvent();
    		}
    	if (e.keyCode == e.END) {
    		var d = this.grid.store.totalLength-this.grid.view.rowIndex;
    		this.grid.view.adjustScrollerPos((d*this.grid.view.rowHeight),true);
            this.grid.view.focusEl.focus();
            this.grid.getSelectionModel().selectRow(this.grid.store.totalLength-1);
    		e.stopEvent();
    		}
    }
})

/**
 * Грид с множественной серверной группировкой на базе Ext.ux.grid.livegrid.GridPanel
 * 
 * @param {Object} config
 */
Ext.m3.MultiGroupingGridPanel = Ext.extend(Ext.ux.grid.livegrid.GridPanel, {
	constructor: function(baseConfig, params){
		// Добавление selection model если нужно
		//var selModel = params.selModel;
		var selModel = new Ext.ux.grid.livegrid.RowSelectionModel({singleSelect: true});
		var gridColumns = params.colModel || [];
		if (selModel && selModel instanceof Ext.grid.CheckboxSelectionModel) {
			gridColumns.columns.unshift(selModel);
		}
		
		// Навешивание обработчиков на контекстное меню если нужно 
		var funcContMenu;
		if (params.menus.contextMenu && 
			params.menus.contextMenu instanceof Ext.menu.Menu) {
			
			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
			funcContMenu = Ext.emptyFn;
		}
		
		var funcRowContMenu;
		if (params.menus.rowContextMenu && 
			params.menus.rowContextMenu instanceof Ext.menu.Menu) {
			
			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
				if (!this.getSelectionModel().isSelected(index)) {
						this.getSelectionModel().selectRow(index);
				};
                params.menus.rowContextMenu.showAt(e.getXY())
			}
		} else {
			funcRowContMenu = Ext.emptyFn;
		}
		
		// плугин для группировки колонок
		var group_param = {
			groupedColumns: params.groupedColumns,
			dataIdField: params.dataIdField,
			dataDisplayField: params.dataDisplayField
		};
		var plugins = [new Ext.ux.grid.MultiGrouping(group_param)];
		
		plugins = plugins.concat(params.plugins || []);
		var bundedColumns = params.bundedColumns;
		if (bundedColumns && bundedColumns instanceof Array &&
			bundedColumns.length > 0) {
			plugins.push( 
				new Ext.ux.grid.ColumnHeaderGroup({
					rows: bundedColumns
				})
			);
		}
		
		// объединение обработчиков
		baseConfig.listeners = Ext.applyIf({
			contextmenu: funcContMenu
			,rowcontextmenu: funcRowContMenu
		}, baseConfig.listeners || {});

		var config = Ext.applyIf({
			sm: selModel
			,colModel: gridColumns
			,plugins: plugins
			,view: new Ext.ux.grid.livegrid.GridView({
		        nearLimit : 100 // количество соседних загружаемых элементов при буферизации
		        ,loadMask  : { msg :  'Загрузка, подождите...' }
		    	})
		}, baseConfig);
		
		Ext.m3.MultiGroupingGridPanel.superclass.constructor.call(this, config);
	}
	,initComponent: function(){
		Ext.m3.MultiGroupingGridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		uiAjaxFailMessage(response, options);
	}
});


/*******************
 * Плагин для экпорта в xls - отправляет на сервер запрос с нужными параметрами
 *******************/

Ext.ns('Ext.ux.grid');

Ext.ux.grid.MultiGroupingExporter = Ext.extend(Ext.util.Observable,{
    constructor: function(config){
    	if (config) Ext.apply(this, config);
        Ext.ux.grid.MultiGroupingExporter.superclass.constructor.call(this);
    },
    init: function(grid){
    	// убедимся, что это нужный нам грид
        if (grid instanceof Ext.ux.grid.livegrid.GridPanel){
            this.grid = grid;
            this.grid.on('afterrender', this.onRender, this);
            // найдем плагин группировки
            for (var i = 0; i <= this.grid.plugins.length; i++) {
            	if (this.grid.plugins[i] instanceof Ext.ux.grid.MultiGrouping) {
            		this.groupPlugin = this.grid.plugins[i];
            		break;
            	}
            }
        }
    },
    onRender:function(){
        //создадим top bar, если его нет
        if (!this.grid.tbar){
            this.grid.elements += ',tbar';
            tbar = new Ext.Toolbar();
            this.grid.tbar = tbar;
            this.grid.add(tbar);
            this.grid.doLayout();
        }
        //добавим кнопку
        this.grid.tbar.add(new Ext.Button({
            text:'Экспорт',
            listeners:{
                scope:this,
                click:this.exportData                
            }
        }));
    },
    exportData:function(){
    	// соберем расположение колонок
        columns = []
        Ext.each(this.grid.colModel.config,function(column,index){
            columns.push({
                data_index:column.dataIndex,
                header:column.header,
                width:column.width,
                hidden:column.hidden
            })
        });
        params = {
            columns: Ext.encode(columns),
            title: this.title || this.grid.title || this.grid.id,
            totalLength: this.grid.view.ds.totalLength
        };
        if (this.grid.getStore().sortInfo != undefined){
        	params.sort = this.grid.getStore().sortInfo.field;
        	params.dir = this.grid.getStore().sortInfo.direction;
        }
        if (this.groupPlugin != undefined) {
        	params.grouped = Ext.util.JSON.encode(this.groupPlugin.groupedColumns);
        	params.exp = Ext.util.JSON.encode(this.groupPlugin.expandedItems);
        }
        this.grid.view.showLoadMask(true);
        Ext.Ajax.request({
            url : this.exportUrl,
            success : function(res,opt){
            	this.grid.view.showLoadMask(false);
                location.href=res.responseText;
            },
            failure : function(){
            	this.grid.view.showLoadMask(false);
            },
            params : params,
            scope: this
        });
    }
});

/*******************
 * Плагин для показа итогов в гриде
 *******************/

Ext.ns('Ext.ux.grid');

Ext.ux.grid.MultiGroupingSummary = function(config) {
    Ext.apply(this, config);
};

Ext.extend(Ext.ux.grid.MultiGroupingSummary, Ext.util.Observable, {
    // configurable scrollbar width (used only in the event the Ext.getScrollBarWidth() method is not available)
    scrollBarWidth : 17,

    // private
    init : function(grid) {
        var v = grid.getView();

        Ext.apply(this, {
            grid    : grid,
            view    : v
        });

        // override GridView's onLayout() method
        v.onLayout = this.onLayout;

        // IE6/7 disappearing vertical scrollbar workaround
        if (Ext.isIE6 || Ext.isIE7) {
            if (!grid.events['viewready']) {
                // check for "viewready" event on GridPanel -- this event is only available in Ext 3.x,
                // so the plugin hotwires it in if it doesn't exist
                v.afterMethod('afterRender', function() {
                    this.grid.fireEvent('viewready', this.grid);
                }, this);
            }

            // a small (hacky) delay of ~10ms is required to prevent
            // the vertical scrollbar from disappearing in IE6/7
            grid.on('viewready', function() {
                this.toggleGridHScroll(false);
            }, this, { delay: 10 });
        } else {
            v.afterMethod('render', this.toggleGridHScroll, this);
        }

        v.afterMethod('render', this.refreshSummary, this);
        v.afterMethod('refresh', this.refreshSummary, this);
        //v.afterMethod('onColumnWidthUpdated', this.doWidth, this);//kirov
        //v.afterMethod('onAllColumnWidthsUpdated', this.doAllWidths, this);//kirov
        //v.afterMethod('onColumnHiddenUpdated', this.doHidden, this); //kirov
        grid.on('columnresize', this.refreshSummary, this);//kirov
        grid.on('columnmove', this.refreshSummary, this);//kirov
        grid.getColumnModel().on('hiddenchange', this.refreshSummary, this);//kirov
        grid.on('bodyresize', this.refreshSummary, this);//kirov
        

        if (Ext.isGecko || Ext.isOpera) {
            // restore gridview's horizontal scroll position when store data is changed
            //
            // TODO -- when sorting a column in Opera, the summary row's horizontal scroll position is
            //         synced with the gridview, but is displaced 1 vertical scrollbar width to the right
            v.afterMethod('onDataChange', this.restoreGridHScroll, this);
        }

        grid.on({
            bodyscroll      : this.syncSummaryScroll,
            beforedestroy   : this.beforeDestroy,
            scope           : this
        });

        // update summary row on store's add/remove/clear/update events
        grid.store.on({
            add     : this.refreshSummary,
            remove  : this.refreshSummary,
            clear   : this.refreshSummary,
            update  : this.refreshSummary,
            scope   : this
        });

        if (!this.rowTpl) {
            this.rowTpl = new Ext.Template(
                '<div class="x-grid3-summary-row x-grid3-gridsummary-row-offset">',
                    '<table class="x-grid3-summary-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                        '<tbody><tr>{cells}</tr></tbody>',
                    '</table>',
                '</div>'
            );
            this.rowTpl.disableFormats = true;
        }
        this.rowTpl.compile();

        if (!this.cellTpl) {
            this.cellTpl = new Ext.Template(
                '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}">',
                    '<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on" {attr}>{value}</div>',
                "</td>"
            );
            this.cellTpl.disableFormats = true;
        }
        this.cellTpl.compile();
    },
    /* kirov
    // private
    calculate : function(rs, cm) {
        var data = {},
            cfg = cm.config,
            i, len, cf, cname, j, jlen, r;

        for (i = 0, len = cfg.length; i < len; i++) { // loop through all columns in ColumnModel
            cf = cfg[i]; // get column's configuration
            cname = cf.dataIndex; // get column dataIndex

            // initialise grid summary row data for
            // the current column being worked on
            data[cname] = 0;

            if (cf.summaryType) {
            	for (j = 0, jlen = rs.length; j < jlen; j++) {
                    r = rs[j]; // get a single Record
                    data[cname] = Ext.ux.grid.MultiGroupingSummary.Calculations[cf.summaryType](r.get(cname), r, cname, data, j);
                }
            }
        }

        return data;
    },
	*/
    // private
    onLayout : function(vw, vh) { // note: this method is scoped to the GridView
        if (typeof(vh) != 'number') { // handles grid's height:'auto' config
            return;
        }

        if (!this.grid.getGridEl().hasClass('x-grid3-hide-gridsummary')) {
            // readjust gridview's height only if grid summary row is visible
            this.scroller.setHeight(vh - this.summaryWrap.getHeight());
        }
    },

    // private
    syncScroll : function(refEl, scrollEl, currX, currY) {
        currX = currX || refEl.scrollLeft;
        currY = currY || refEl.scrollTop;

        if (this.oldX != currX) { // only adjust horizontal scroll when horizontal scroll is detected
            scrollEl.scrollLeft = currX;
            scrollEl.scrollLeft = currX; // second time for IE (1/2 the time first call fails. other browsers simply ignore repeated calls)
        }

        // remember current scroll position
        this.oldX = currX;
        this.oldY = currY;
    },

    // private
    syncSummaryScroll : function(currX, currY) {
        var v = this.view,
            y = this.oldY;

        if (
            // workaround for Gecko's horizontal-scroll reset bug
            // (see unresolved mozilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=386444
            // "using vertical scrollbar changes horizontal scroll position with overflow-x:hidden and overflow-y:scroll")
            Ext.isGecko     &&          // 1) <div>s with overflow-x:hidden have their DOM.scrollLeft property set to 0 when scrolling vertically
            currX === 0     &&          // 2) current x-ordinate is now zero
            this.oldX > 0   &&          // 3) gridview is not at x=0 ordinate
            (y !== currY || y === 0)    // 4) vertical scroll detected / vertical scrollbar is moved rapidly all the way to the top
        ) {
            this.restoreGridHScroll();
        } else {
            this.syncScroll(v.scroller.dom, v.summaryWrap.dom, currX, currY);
        }
    },

    // private
    restoreGridHScroll : function() {
        // restore gridview's original x-ordinate
        // (note: this causes an unvoidable flicker in the gridview)
        this.view.scroller.dom.scrollLeft = this.oldX || 0;
    },

    // private
    syncGridHScroll : function() {
        var v = this.view;

        this.syncScroll(v.summaryWrap.dom, v.scroller.dom);
    },

    // private
    doWidth : function(col, w, tw) {
        var s = this.getSummaryNode(),
            fc = s.dom.firstChild;

        fc.style.width = tw;
        fc.rows[0].childNodes[col].style.width = w;

        this.updateSummaryWidth();
    },

    // private
    doAllWidths : function(ws, tw) {
        var s = this.getSummaryNode(),
            fc = s.dom.firstChild,
            cells = fc.rows[0].childNodes,
            wlen = ws.length,
            j;

        fc.style.width = tw;

        for (j = 0; j < wlen; j++) {
            cells[j].style.width = ws[j];
        }

        this.updateSummaryWidth();
    },

    // private
    doHidden : function(col, hidden, tw) {
        var s = this.getSummaryNode(),
            fc = s.dom.firstChild,
            display = hidden ? 'none' : '';

        fc.style.width = tw;
        fc.rows[0].childNodes[col].style.display = display;

        this.updateSummaryWidth();
    },

    // private
    getGridHeader : function() {
        if (!this.gridHeader) {
            this.gridHeader = this.view.mainHd.child('.x-grid3-header-offset');
        }

        return this.gridHeader;
    },

    // private
    updateSummaryWidth : function() {
        // all browsers add a 1 pixel space between the edges of the vert. and hori. scrollbars,
        // so subtract one from the grid header width before setting the summary row's width
        //kirov this.getSummaryNode().setWidth(this.getGridHeader().getWidth() - 1);
    	if (this.getSummaryNode()) {
    		this.getSummaryNode().setWidth(this.view.getTotalWidth()); //kirov
    	}
    	// kirov
    	if (Ext.isIE) {
	    	var elWidth = this.grid.getGridEl().getSize().width;
	    	if (this.grid.getColumnModel().getTotalWidth()+this.view.getScrollOffset() > elWidth){
	    		//console.log('scroll');
	    		//debugger;
	    		this.view.summaryWrap.dom.style['overflow-y'] = 'hidden';
	    		this.view.summaryWrap.setHeight(((Ext.getScrollBarWidth ? Ext.getScrollBarWidth() : this.scrollBarWidth) + 18 /* 18 = row-expander height */));
	    	} else {
	    		this.view.summaryWrap.dom.style['overflow-y'] = 'visible';
	    		this.view.summaryWrap.setHeight((Ext.getScrollBarWidth ? Ext.getScrollBarWidth() : this.scrollBarWidth));
	    	}
    	}
    },

    // private
    renderSummary : function(o, cs, cm) {
    	if (!o.data) {
    		return;
    	}
    	
    	cs = cs || this.view.getColumnData();

        var cfg = cm.config,
            buf = [],
            last = cs.length - 1,
            i, len, c, cf, p;

        for (i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            cf = cfg[i];
            p = {};

            p.id = c.id;
            p.style = c.style;
            p.css = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');

            if (cf.summaryType || cf.summaryRenderer) {
                p.value = (cf.summaryRenderer || c.renderer)(o.data[c.name], p, o);
            } else {
                p.value = '';
            }
            if (p.value === undefined || p.value === "") {
                p.value = "&#160;";
            }
            buf[buf.length] = this.cellTpl.apply(p);
        }

        return this.rowTpl.apply({
            tstyle: 'width:' + this.view.getTotalWidth() + ';',
            cells: buf.join('')
        });
    },
    
    // private
    refreshSummary : function() {
    	var g       = this.grid,
            ds      = g.store,
            cs      = this.view.getColumnData(),
            cm      = g.getColumnModel(),
            rs      = ds.getRange(),
            data	= ds.totalRow || {},//data    = this.calculate(rs, cm), //kirov
            buf     = this.renderSummary({data: data}, cs, cm);

    	if (!this.view.summaryWrap) {
            this.view.summaryWrap = Ext.DomHelper.insertAfter(this.view.scroller, {
                // IE6/7/8 style hacks:
                // - width:100% required for horizontal scroll to appear (all the time for IE6/7, only in GroupingView for IE8)
                // - explicit height required for summary row to appear (only for IE6/7, no effect in IE8)
                // - overflow-y:hidden required to hide vertical scrollbar in summary row (only for IE6/7, no effect in IE8)
                style   : 'overflow:auto;' + (Ext.isIE ? 'width:100%;overflow-y:hidden;height:' + ((Ext.getScrollBarWidth ? Ext.getScrollBarWidth() : this.scrollBarWidth)/* 18 = row-expander height */) + 'px;' : ''),
                tag     : 'div',
                cls     : 'x-grid3-gridsummary-row-inner'
            }, true);

            // synchronise GridView's and GridSummary's horizontal scroll
            this.view.summaryWrap.on('scroll', this.syncGridHScroll, this);
        }
    	
        // update summary row data
        this.setSummaryNode(this.view.summaryWrap.update(buf).first());

        this.updateSummaryWidth();
    },

    // private
    toggleGridHScroll : function(allowHScroll) {
        // toggle GridView's horizontal scrollbar
    	//kirov
    	if (allowHScroll){
    		this.view.scroller.dom.style.overflow = 'auto';
    	} else {
    		this.view.scroller.dom.style.overflow = 'hidden';
    	}
        this.view.scroller[allowHScroll === undefined ? 'toggleClass' : allowHScroll ? 'removeClass' : 'addClass']('x-grid3-gridsummary-hide-hscroll');
    },

    // show/hide summary row
    toggleSummary : function(visible) { // true to display summary row
        var el = this.grid.getGridEl(),
            v = this.view;

        if (el) {
            el[visible === undefined ? 'toggleClass' : visible ? 'removeClass' : 'addClass']('x-grid3-hide-gridsummary');

            // toggle gridview's horizontal scrollbar
            this.toggleGridHScroll();

            // readjust gridview height
            v.layout();

            // sync summary row scroll position
            v.summaryWrap.dom.scrollLeft = v.scroller.dom.scrollLeft;
        }
    },

    // get summary row Element
    getSummaryNode : function() {
        return this.view.summary;
    },

    // private
    setSummaryNode : function(sn) {
        this.view.summary = sn;
    },

    // private
    beforeDestroy : function() {
        Ext.destroy(
            this.view.summary,
            this.view.summaryWrap
        );

        delete this.grid;
        delete this.view;
        delete this.gridHeader;
        delete this.oldX;
        delete this.oldY;
    }
});
Ext.reg('multigroupingsummary', Ext.ux.grid.MultiGroupingSummary);