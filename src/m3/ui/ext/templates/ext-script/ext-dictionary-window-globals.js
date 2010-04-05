var ajax = Ext.Ajax;

/**
 *  Создание нового значения в справочнике по форме ExtDictionary
 */
function new_value() {
	ajax.request({
		url: "{{ component.url_new }}"
		,success: function(response, opts){
		   eval(response.responseText);
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
}

/**
 * Редактирование значения в справочнике по форме ExtDictionary
 */
function edit_value(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	
	ajax.request({
		url: "{{ component.url_edit }}"
		,params: {
			'pk': grid.getSelectionModel().getSelected().id
		}
		,success: function(response, opts){
		   eval(response.responseText);
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
}

/**
 * Удаление значения в справочнике по форме ExtDictionary
 */
function delete_value(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	
	ajax.request({
		url: "{{ component.url_delete }}"
		,params: {
			'pk': grid.getSelectionModel().getSelected().id
		}
		,success: function(response, opts){
		   eval(response.responseText);
		}
		,failure: function(response, opts){
		   Ext.Msg.alert('','failed');
		}
	});
}

/**
 * Выбор значения в справочнике по форме ExtDictionary
 */
function select_value(){
	var grid = Ext.getCmp('{{ component.grid.client_id}}');
	var win = Ext.getCmp('{{ component.client_id}}');
	
	// здесь должна быть обработка выбора значения

	win.close();
}