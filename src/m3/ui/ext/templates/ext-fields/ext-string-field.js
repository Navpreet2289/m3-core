new Ext.form.TextField({
	id: '{{ component.client_id }}'
	{% if component.name %}, name: '{{ component.name }}' {% endif %}
	{% if component.label %}, fieldLabel: '{{ component.label }}' {% endif %}
	{% if component.value %}, value: '{{ component.value }}' {% endif %}
	{% if component.width %}, width: '{{ component.width }}' {% endif %}
	{% if component.height %}, height: '{{ component.height }}' {% endif %}
	
	{% if component.input_type %}, inputType: '{{ component.input_type }}' {% endif %}
	{% if component.html  %}, html: '{{ component.html|safe }}' {% endif %}
	{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
	
	{% if component.allow_blank %} ,allowBlank: {{ component.allow_blank }} {% endif %}
	{% if component.min_length %} ,minLength: {{ component.min_length }} {% endif %}
	{% if component.max_length %} ,maxLength: {{ component.max_length }} {% endif %}
	{% if component.regex %} ,regex: {{ component.regex }} {% endif %}
	{% if component.min_length_text %} ,minLengthText: {{ component.min_length_text }} {% endif %}
	{% if component.max_length_text %} ,maxLengthText: {{ component.max_length_text }} {% endif %}
	{% if component.regex_text %} ,regexText: {{ component.regex_text }} {% endif %}
	
	{% if component.label_style %} ,labelStyle: "{{ component.t_render_label_style|safe }}" {% endif %}
})