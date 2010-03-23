new Ext.Button({
	id: '{{ component.client_id }}'
	, text: "{{ component.text }}"
	, icon: "{{ component.icon }}"
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	{% if component.handler %}
		,handler: {{ component.t_render_handler|safe}}
	{% endif%}
})


