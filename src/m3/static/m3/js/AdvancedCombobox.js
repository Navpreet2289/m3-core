/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */
Ext.m3.AdvancedComboBox = Ext.extend(Ext.form.ComboBox,{
	
	// Будет ли задаваться вопрос перед очисткой значения
	askBeforeDeleting: true
	
	,actionSelectUrl: null
	,actionEditUrl: null
	,actionContextJson: null
	
	,hideBaseTrigger: false
	
	,defaultValue: null
	,defaultText: null
	
	// кнопка очистки
	,hideTriggerClear: false
	
	// кнопка выбора из выпадающего списка
	,hideTriggerDropDown: false
	
	// кнопка выбора из справочника
	,hideTriggerDictSelect: false
	
	// кнопка редактирования элемента
	,hideTriggerDictEdit: false
	
	// Количество записей, которые будут отображаться при нажатии на кнопку 
	// выпадающего списка
	,defaultLimit: 50
	
	// css классы для иконок на триггеры 
	,triggerClearClass:'x-form-clear-trigger'
	,triggerSelectClass:'x-form-select-trigger'
	,triggerEditClass:'x-form-edit-trigger'
	
	// Инициализация происходит в методе initBaseTrigger
	,baseTriggers: [
		{
			iconCls: 'x-form-clear-trigger',
			handler: null,
			hide: null
		}
		,{
			iconCls:'', 
			handler: null,
			hide: null
		}
		,{
			iconCls:'x-form-select-trigger', 
			handler: null,
			hide: null
		}
		,{
			iconCls:'x-form-edit-trigger', 
			handler: null,
			hide: true
		}
	]
	,allTriggers: []
	
	,constructor: function(baseConfig, params){
		console.log(baseConfig);
		console.log(params);
		
		assert(params.actions, 'params.actions is undefined');
		
		if (params.actions.actionSelectUrl) {
			this.actionSelectUrl = params.actions.actionSelectUrl
		}
		
		if (params.actions.actionEditUrl) {
			this.actionEditUrl = params.actions.actionEditUrl;
		}
		
		this.askBeforeDeleting = params.askBeforeDeleting;
		this.actionContextJson = params.actions.actionContextJson;
		
		if (baseConfig['hideTrigger'] ) {
			delete baseConfig['hideTrigger'];
			this.hideBaseTrigger = true;
		}
		

		this.defaultValue = params.defaultValue;
		this.defaultText = params.defaultText;
		
		this.allTriggers = [].concat(this.baseTriggers);
		if (params.customTriggers) {
			Ext.each(params.customTriggers, function(item, index, all){
				console.log(item);
				this.allTriggers.push(item);
			}, this);
		
		}

		Ext.m3.AdvancedComboBox.superclass.constructor.call(this, baseConfig);
	}
	/**
	 * Конфигурация компонента 
	 */
	,initComponent: function () {
		Ext.m3.AdvancedComboBox.superclass.initComponent.call(this);
	
		// см. TwinTriggerField
        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.allTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		if (!this.actionSelectUrl) {
			this.hideTriggerDictSelect = true;
		}
		
		if (!this.actionEditUrl) {
			this.hideTriggerDictEdit = true;
		}
		if ( !this.getValue() ) {
			this.hideTriggerClear = true;
		}
		if (this.hideBaseTrigger){
			this.hideTriggerDropDown = true;
		}

		// Значения по-умолчанию
		if (this.defaultValue && this.defaultText) {
			this.addRecordToStore(this.defaultValue, this.defaultText);
		}

		// Инициализация базовой настройки триггеров
		this.initBaseTrigger();
		
		this.addEvents(
			/**
			 * Генерируется сообщение при нажатии на кнопку вызыва запроса на сервер
			 * true - обработка продолжается
			 * false - отмена обработки
			*/
			'beforerequest',
		
			/**
			 * Генерируется сообщение после выбора значения. 
			 * Здесь может быть валидация и прочие проверки
			 * Возвр. значения:
			 * true - обработка продолжается
			 * false - отмена обработки
			*/
			'afterselect',
		
			/**
			 * Генерируется сообщение после установки значения поля
			*/
			'changed'
		);
	}
	// см. TwinTriggerField
	,getTrigger : function(index){
        return this.triggers[index];
    },
	// см. TwinTriggerField
    initTrigger : function(){
		
        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
        ts.each(function(t, all, index){
			
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.allTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this.allTriggers[index].handler, this, {preventDefault:true});
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);
		
        this.triggers = ts.elements;
    }
	/**
	 * Инициализация первоначальной настройки триггеров 
	 */
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClearClick;
		this.baseTriggers[1].handler = this.onTriggerDropDownClick;
		this.baseTriggers[2].handler = this.onTriggerDictSelectClick;
		this.baseTriggers[3].handler = this.onTriggerDictEditClick;
		
		this.baseTriggers[0].hide = this.hideTriggerClear;
		this.baseTriggers[1].hide = this.hideTriggerDropDown;
		this.baseTriggers[2].hide = this.hideTriggerDictSelect;
		this.baseTriggers[3].hide = this.hideTriggerDictEdit;
	}
	
	// см. TwinTriggerField
    ,getTriggerWidth: function(){
        var tw = 0;
        Ext.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();
				
            if(w === 0 && !this['hidden' + triggerIndex]){
                tw += this.defaultTriggerWidth;
            }else{
                tw += w;
            }
        }, this);
        return tw;
    },
	// см. TwinTriggerField
    // private
    onDestroy : function() {
        Ext.destroy(this.triggers);
		Ext.destroy(this.allTriggers);
		Ext.destroy(this.baseTriggers);
        Ext.m3.AdvancedComboBox.superclass.onDestroy.call(this);
    }

	/**
	 * Вызывает метод выпадающего меню у комбобокса
	 **/
	,onTriggerDropDownClick: function() {
		if (this.fireEvent('beforerequest', this)) {

			if (this.isExpanded()) {
				this.collapse();
			} else {
				
				var baseParams = Ext.applyIf({start:0, limit: this.defaultLimit }, this.getStore().baseParams )
				this.getStore().load({
					params: baseParams
				});
				
				this.onFocus({});
	            if(this.triggerAction == 'all') {
	                this.doQuery(this.allQuery, true);
	            } else {
	                this.doQuery(this.getRawValue());
	            }
			}
			this.el.focus();
		}
	}
	/**
	 * Кнопка открытия справочника в режиме выбора
	 */
	,onTriggerDictSelectClick: function() {
		this.onSelectInDictionary();
	}
	/**
	 * Кнопка очистки значения комбобокса
	 */
	,onTriggerClearClick: function() {
		
		if (this.askBeforeDeleting) {
			var scope = this;
			Ext.Msg.show({
	            title: 'Подтверждение',
	            msg: 'Вы действительно хотите очистить выбранное значение?',
	            icon: Ext.Msg.QUESTION,
	            buttons: Ext.Msg.YESNO,
	            fn:function(btn,text,opt){ 
	                if (btn == 'yes') {
	                    scope.clearValue(); 
	                };
	            }
	        });	
		} else {
			this.clearValue();
		}
	}
	/**
	 * Кнопка открытия режима редактирования записи
	 */
	,onTriggerDictEditClick: function() {
		this.onEditBtn();
	}
	/**
	 * При выборе значения необходимо показывать кнопку "очистить"
	 * @param {Object} record
	 * @param {Object} index
	 */
	,onSelect: function(record, index){
		if (this.fireEvent('afterselect', this, record.data[this.valueField], record.data[this.displayField] )) {
			Ext.m3.AdvancedComboBox.superclass.onSelect.call(this, record, index);
			this.showClearBtn();
			this.fireEvent('change', this, record.data[this.valueField || this.displayField]);
			this.fireEvent('changed', this);
		}
	}
	/**
	 * Показывает кнопку очистки значения
	 */
	,showClearBtn: function(){
		this.getTrigger(0).show();
	}
	/**
	 * Скрывает кнопку очистки значения
	 */
	,hideClearBtn: function(){
		this.getTrigger(0).hide();
	}
	/**
	 * Перегруженный метод очистки значения, плюс ко всему скрывает 
	 * кнопку очистки
	 */
	,clearValue: function(){
		Ext.m3.AdvancedComboBox.superclass.clearValue.call(this);
		this.hideClearBtn();
		
		this.fireEvent('change', this, '');
		this.fireEvent('changed', this);
	}
	/**
	 * Перегруженный метод установки значения, плюс ко всему отображает 
	 * кнопку очистки
	 */
	,setValue: function(value){
		Ext.m3.AdvancedComboBox.superclass.setValue.call(this, value);
		if (value) {
			if (this.rendered) {
				this.showClearBtn();
			} else {
				this.hideTrigger1 = true;
			}
		}
	}
	/**
	 * Генерирует ajax-запрос за формой выбора из справочника и
	 * вешает обработку на предопределенное событие closed_ok
	 */
	,onSelectInDictionary: function(){
		assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );
		
		if(this.fireEvent('beforerequest', this)) { 
			var scope = this;
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,params: this.actionContextJson
				,success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
				        win.on('closed_ok',function(id, displayText){
							if (scope.fireEvent('afterselect', scope, id, displayText)) {
								scope.addRecordToStore(id, displayText);
							}
							
				        });
				    };
				}
				,failure: function(response, opts){
					uiAjaxFailMessage();
				}
			});
		}
	}
	/**
	 * Добавляет запись в хранилище и устанавливает ее в качестве выбранной
	 * @param {Object} id Идентификатор
	 * @param {Object} value Отображаемое значение
	 */
	,addRecordToStore: function(id, value){
    	var record = new Ext.data.Record();
    	record['id'] = id;
    	record[this.displayField] = value;
		this.getStore().loadData({total:1, rows:[record]});    	
		this.setValue(id);
		this.collapse()
		
		this.fireEvent('change', this, id, '');
		this.fireEvent('changed', this);
	}
	/**
	 * Обработчик вызываемый по нажатию на кнопку редактирования записи
	 */
	,onEditBtn: function(){
		assert( this.actionEditUrl, 'actionEditUrl is undefined' );
		
		Ext.Ajax.request({
			url: this.actionEditUrl
			,params: this.actionContextJson
			,success: function(response, opts){
			    smart_eval(response.responseText);
			}
			,failure: function(response, opts){
				uiAjaxFailMessage();
			}
		});
	}
	/**
	 * Не нужно вызывать change после потери фокуса
	 */
	,triggerBlur: Ext.emptyFn
	
});
