function(){
	var contmenu, rowcontmenu;
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "rowcontextmenu" %}
			var rowcontmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var sel_model;
	{% if component.sm %} sel_model = {{ component.sm.render|safe }}; {% endif %}
	
	var baseConfig = {
		{% include 'base-ext-ui.js'%}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
	    {% if component.title %} 
	    	,title: '{{ component.title }}' 
	    	,header: true
	    {% else %}
	    	,header: false
	    {% endif %}
	    {% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.bottom_bar %} ,bbar: {{ component.t_render_bottom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
	    {% if component.sm %} ,sm: sel_model {% endif %}
		{% if component.auto_expand_column %} ,autoExpandColumn: {{ component.auto_expand_column}} {% endif %}
		{% if component.load_mask %} ,loadMask: true {% endif %}
		,store: {{ component.t_render_store|safe }}
		,stripeRows: true
		,stateful: true
		,viewConfig: {forceFit: {% if component.force_fit %}true{% else %}false{% endif %}}
		{% if component.drag_drop %} ,enableDragDrop: true {% endif %}
		{% if component.drag_drop_group %} ,ddGroup:'{{ component.drag_drop_group }}' {% endif %}
		
		{% if component.t_render_simple_listeners %}
		,listeners: {{ component.t_render_simple_listeners|safe}}
		{%endif%}
	}

	{% block code_extenders %}{% endblock %}
	
	var params = {
		selModel: sel_model
		,columns: [{{ component.t_render_columns|safe }}]
		,menus: {
			contextMenu: contmenu
			,rowContextMenu: rowcontmenu
		}
		,plugins: {
			bundedColumns: [{{ component.t_render_banded_columns|safe }}]
		}
	}
	
	return createGridPanel(baseConfig, params);
}()