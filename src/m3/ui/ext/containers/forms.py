#coding:utf-8
'''
Created on 25.02.2010

@author: akvarats
'''

import datetime
import decimal
import os

from PIL import Image # require PIL module 

from django.core.files.base import ContentFile
from django.conf import settings

from m3.ui.ext.fields.base import BaseExtField
from m3.ui.ext.fields import (ExtNumberField, 
                                     ExtStringField, 
                                     ExtDateField,
                                     ExtCheckBox, ExtComboBox, ExtTimeField,
                                     ExtHiddenField,
                                     ExtFileUploadField,ExtImageUploadField)
# В качестве значений списка TypedList атрибутов могут выступать объекты:
from base import BaseExtPanel
from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.fields.complex import ExtDictSelectField
from m3.helpers import get_img_size
from m3.helpers.datastructures import TypedList
#from m3.ui.actions.packs import BaseDictionaryActions

#===============================================================================
class ExtForm(BaseExtPanel):
    '''
    Форма, умеющая биндиться и делать сабмит по урлу
    
    @version: 0.1
    @begin_designer
    {title: "Form"
    ,ext_class: "Ext.form.FormPanel"
    ,xtype: "form"
    ,attr: [{
        ext_attr: "layout"
        ,py_attr: "layout" 
        ,default_value: "form"
    },{
        ext_attr: "fileUpload"
        ,py_attr: "file_upload"
        ,default_value: false
    },{
        ext_attr: "url"
        ,py_attr: "url"
    },{
        ext_attr: "padding"
        ,py_attr: "padding"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtForm, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-form.js'
        self.layout = 'form'
        self.padding = None
        self.url = None
        self.file_upload = False
        self.object = None
        
        # поле, которое будет под фокусом ввода после рендеринга формы
        self.focused_field = None 
        
        self.init_component(*args, **kwargs)
    
    def _get_all_fields(self, item, list = None):
        '''
        Возвращает список всех полей формы включая вложенные в контейнеры
        '''
        if list == None:
            list = []   
        if isinstance(item, BaseExtField):
            list.append(item)
            #print list
        elif hasattr(item, 'items'):
            for it in item.items:
                self._get_all_fields(it, list)       
        return list
    
    def bind_to_request(self, request):
        '''
        Извлекает из запроса параметры и присваивает их соответствующим полям 
        формы
        '''
        assert request, 'Request must be define!'

        all_fields = self._get_all_fields(self)
        for field in all_fields:
            name = field.name
            if isinstance(field, ExtFileUploadField) or \
                isinstance(field, ExtImageUploadField):
                # Файлы нужно забирать из request.FILES
                field.memory_file = request.FILES.get(
                                        ExtFileUploadField.PREFIX + field.name)
      
            value = request.POST.get(name)
            field.value = value
    
    #TODO необходимо добавить проверку на возникновение exception'ов
    def from_object(self, object, exclusion = []):
        '''
        Метод выполнения прямого связывания данных атрибутов объекта object и 
        полей текущей формы
        '''
        
#        неправильно обходить объект, надо обходить форму 
#        def _parse_obj(obj, prefix=''):
#            '''
#            Разбивает объект на словарь, ключи которого имена полей(имена 
#            вложенных объектов записываются через '.'), 
#            а значения - значения соответсвующих полей объекта
#            '''
#            attrs = {}
#            object_fields = obj if isinstance(obj, dict) else obj.__dict__
#            for key, value in object_fields.items():
#                #TODO как определить, что класс встроенный
#                if not hasattr(value, '__dict__') and not isinstance(value, dict):
#                    attrs[prefix+str(key)] = value
#                else:
#                    pre_prefix = prefix+'.' if prefix else ''
#                    attrs.update(_parse_obj(value, pre_prefix+str(key)+'.'))
#            return attrs
        
        def is_secret_token(value):
            ''' 
            Возвращает истину если значение поля содержит секретный ключ с 
            персональной информацией. Он не должен биндится, 
            т.к. предназначен для обработки в personal.middleware 
            '''
            return unicode(value)[:2] == u'##'
        
        def _assign_value(value, item):
            '''
            Конвертирует и присваивает значение value в соответствии типу item.
            '''
            if isinstance(item, (ExtStringField, ExtNumberField,)):
                if value:
                    item.value = unicode(value)
                else:
                    item.value = u''
            elif isinstance(item, ExtDateField):
                #item.value = value.strftime('%d.%m.%Y') \
                # для дат, до 1900 года метод выше не работает
                item.value = '%02d.%02d.%04d' % (value.day,value.month,value.year) \
                    if not is_secret_token(value) else unicode(value)   
                      
            elif isinstance(item, ExtTimeField):
                #item.value = value.strftime('%H:%M') \
                # для дат, до 1900 года метод выше не работает
                item.value = '%02d:%02d' % (value.hour,value.minute) \
                    if not is_secret_token(value) else unicode(value)
                    
            elif isinstance(item, ExtCheckBox):
                item.checked = True if value else False
            elif isinstance(item, ExtDictSelectField):
                # У поля выбора может быть сзязанный с ним пак
                # TODO после окончательного удаления метода configure_by_dictpack в ExtDictSelectField
                # нужно удалить проверку на 'bind_pack'
                bind_pack = getattr(item, 'pack', None) or getattr(item, 'bind_pack', None)
                if bind_pack:
                    # Нельзя импортировать, будет циклический импорт
                    #assert isinstance(item.bind_pack, BaseDictionaryActions)
                    row = bind_pack.get_row(value)
                    # Может случиться что в источнике данных bind_pack 
                    # не окажется записи с ключом id
                    # Потому что источник имеет заведомо неизвестное происхождение
                    if row != None:
                        default_text = getattr(row, item.display_field)
                        # getattr может возвращать метод, например verbose_name
                        if callable(default_text):
                            item.default_text = default_text()
                        else:
                            item.default_text = default_text
                item.value = value
            elif isinstance(item, ExtComboBox) and hasattr(item, 'bind_rule_reverse'):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто  преобразовать в тип объекта, 
                # Поэтому нужно использовать либо трансляцию значений, 
                #либо вызывать специальную функцию внутри экземпляра комбобокса.
                if callable(item.bind_rule_reverse):
                    item.value = str(item.bind_rule_reverse(value))
                elif isinstance(item.bind_rule_reverse, dict):
                    item.value = str(item.bind_rule_reverse.get(value))
                else:
                    raise ValueError('Invalid attribute type bind_rule_reverse. \
                        Must be a function or a dict.')
                    
            elif isinstance(item, ExtFileUploadField) or \
                isinstance(item, ExtImageUploadField):
                item.value = unicode(value)
                # Относительную URL ссылку до статики
                
                if hasattr(settings, 'MEDIA_URL'):                    
                    item.file_url = '%s/%s' % (settings.MEDIA_URL,  unicode(value) )
                else:
                    item.file_url = None
                    
                # Прибиндим оригинальные размеры thumbnail
                if isinstance(item, ExtImageUploadField):
                    if hasattr(settings, 'MEDIA_ROOT') and item.thumbnail:
                        ffile = os.path.join(settings.MEDIA_ROOT, unicode(value))
                        dir = os.path.dirname(ffile)
                        file_name = os.path.basename(ffile)
                        
                        thumb_file = os.path.join(dir, 
                            ExtImageUploadField.THUMBNAIL_PREFIX + file_name)
                        if os.path.exists(thumb_file):
                            thumb = Image.open(thumb_file)
                            item.thumbnail_size = thumb.size
                        
            else:
                item.value = unicode(value)

        def get_value(obj, names):
            '''
            Ищет в объекте obj поле с именем names и возвращает его значение. 
            Если соответствующего поля не оказалось, то возвращает None
            
            names задается в виде списка, т.о. если его длина больше единицы, 
            то имеются вложенные объекты и их надо обработать
            '''

            # hasattr не работает для dict'a
            has_attr = hasattr(obj, names[0]) if not isinstance(obj, dict) else names[0] in obj 
            if has_attr:
                if len(names) == 1:
                    if isinstance(obj, dict):
                        return obj[names[0]]         
                    else:
                        return getattr(obj, names[0])
                else:
                    nested = getattr(obj, names[0]) if not isinstance(obj, dict) else obj[names[0]]
                    return get_value(nested, names[1:])
            return None

        all_fields = self._get_all_fields(self)
        for field in all_fields:
            if not field.name:
                continue
            assert not isinstance(field.name, unicode), 'The names of all fields \
                must not be instance of unicode'
            assert isinstance(field.name, str) and len(field.name) > 0, \
                  'The names of all fields must be set for a successful \
                      assignment. Check the definition of the form.'
            # заполним атрибуты только те, которые не в списке исключаемых
            if not field.name in exclusion:

                names = field.name.split('.')                
                new_val = get_value(object, names)
                if new_val != None:
                    _assign_value(new_val, field)
        
        
        #неправильно сначала обходить объект, надо обходить форму 
        #fields = _parse_obj(object)
        #if fields:
        #    for item in self._get_all_fields(self):
        #        # заполним атрибуты только те, которые не в списке исключаемых
        #        if not item.name in exclusion:
        #

    #TODO необходимо добавить проверку на возникновение exception'ов
    def to_object(self, object, exclusion = []):
        '''
        Метод выполнения обратного связывания данных.
        '''       
        def _save_image(obj, name, field):
            # Работа с изображением или файлом
            if hasattr(obj, name):
                l_field = getattr(obj, name)
                if l_field and os.path.exists(l_field.path) and \
                    os.path.basename(l_field.file.name) != field.value:
                    
                    # Сначало нужно удалить thumbnail картинки
                    if isinstance(field, ExtImageUploadField) and \
                        field.thumbnail:
                        current_dir = os.path.dirname(l_field.path)
                        basename = os.path.basename(l_field.path)
                        thumb = os.path.join(current_dir, 
                                             field.THUMBNAIL_PREFIX + basename)
                        
                        if os.path.exists(thumb):
                            os.remove(thumb)
                    
                    # Файл изменился, удаляем старый     
                    l_field.delete(save=False)
                        
                if field.memory_file:
                    cont_file = ContentFile(field.memory_file.read())
                    name_file = field.memory_file.name
                    
                    l_field = getattr(obj, name)
                    l_field.save(name_file, cont_file, save = False)
                    
                    # А так же нужно сохранять thumbnail картинки
                    if isinstance(field, ExtImageUploadField) and \
                        field.thumbnail:
                        current_dir = os.path.dirname(l_field.path)
                        
                        img = Image.open(l_field.path)
                        
                        width, height = img.size
                        max_width, max_height = field.image_max_size
                
                        # Обрезаем изображение, если нужно
                        if width > max_width or height > max_height:
                
                            curr_width, curr_height = \
                                get_img_size(field.image_max_size, img.size)
                                
                            new_img = img.resize((curr_width, curr_height),
                                       Image.ANTIALIAS)
                            new_img.save(l_field.path)
                        
                        # Генерируем thumbnails
                        tmumb_curr_width, tmumb_curr_height = \
                            get_img_size(field.thumbnail_size, img.size)
                            
                        img.thumbnail((tmumb_curr_width, tmumb_curr_height), 
                                        Image.ANTIALIAS)
                        base_name = os.path.basename(l_field.path)
                        tmb_path = os.path.join(current_dir, 
                                ExtImageUploadField.THUMBNAIL_PREFIX + base_name)
                        img.save(tmb_path)    

        def set_field(obj, names, value, field=None):
            '''
            Ищет в объекте obj поле с именем names и присваивает значение value. 
            Если соответствующего поля не оказалось, то оно не создается
            
            names задается в виде списка, т.о. если его длина больше единицы, 
            то имеются вложенные объекты
            '''

            # hasattr не работает для dict'a
            has_attr = hasattr(obj, names[0]) if not isinstance(obj, dict) else names[0] in obj 
            if has_attr:
                if len(names) == 1:
                    if isinstance(obj, dict):
                        obj[names[0]] = value        
                    elif isinstance(field, ExtFileUploadField) or \
                        isinstance(field, ExtImageUploadField):
                        _save_image(obj, names[0], field)
                        
                    else:
                        # Для id нельзя присваивать пустое значение! 
                        # Иначе модели не будет сохраняться
                        if names[0] == 'id' and value == '':
                            return

                        setattr(obj, names[0], value)
                else:
                    nested = getattr(obj, names[0]) if not isinstance(obj, dict) else obj[names[0]]
                    set_field(nested, names[1:], value, field)

        def try_to_int(value, default=None):
            ''' Пробует преобразовать value в целое число, 
            иначе возвращает default '''
            try:
                return int(value)
            except:
                return default

        def convert_value(item):
            '''Берет значение item.value, 
            и конвертирует его в соответствии с типом item'a
            '''
            val = item.value
            if isinstance(item, ExtNumberField):
                if val:
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = decimal.Decimal(val)
                        except decimal.InvalidOperation:
                            val = None
                else:
                    val = None
            elif isinstance(item, ExtStringField):
                val = unicode(val)   
            elif isinstance(item, ExtDateField):
                #TODO уточнить формат дат
                if val and val.strip():
                    val = datetime.datetime.strptime(val, '%d.%m.%Y')
                else:
                    val = None
            elif isinstance(item, ExtTimeField):
                if val and val.strip():
                    d = datetime.datetime.strptime(val, '%H:%M')
                    val = datetime.time(d.hour, d.minute, 0)
                else:
                    val = None
            elif isinstance(item, ExtCheckBox):
                val = True if val == 'on' else False
            elif isinstance(item, ExtComboBox):
                # Комбобокс как правило передает id выбранного значения. 
                #Его не так просто преобразовать в тип объекта, 
                # т.к. мы ничего не знаем о структуре объекта.
                # Поэтому нужно использовать либо трансляцию значений, 
                # либо вызывать специальную функцию внутри экземпляра комбобокса.
                if hasattr(item, 'bind_rule'):
                    if callable(item.bind_rule):
                        val = item.bind_rule(val)
                    elif isinstance(item.bind_rule, dict):
                        val = item.bind_rule.get(val)
                    else:
                        raise ValueError('Invalid attribute type bind_rule. \
                                Must be a function or a dict.')
                else:
                    val = try_to_int(val)
                    
            elif isinstance(item, ExtDictSelectField):
                val = try_to_int(val, val) if val else None
                
            elif isinstance(item, ExtHiddenField):
                if item.type == ExtHiddenField.INT:
                    val = try_to_int(val)
                elif item.type == ExtHiddenField.STRING:
                    val = unicode(val)           
            return val
        
        # Присваиваем атрибутам связываемого объекта соответствующие поля формы
        self.object = object        
        all_fields = self._get_all_fields(self)
        for field in all_fields:
            if not field.name:
                continue
            assert not isinstance(field.name, unicode), 'The names of all fields \
                must not be instance of unicode'
            assert isinstance(field.name, str) and len(field.name) > 0, \
                  'The names of all fields must be set for a successful \
                      assignment. Check the definition of the form.'
            # заполним атрибуты только те, которые не в списке исключаемых
            if not field.name in exclusion:

                names = field.name.split('.')                
                set_field(self.object, names, convert_value(field), field)
     
    @property
    def items(self):       
        return self._items
    
    def pre_render(self):
        super(ExtForm, self).pre_render()
        if not self.focused_field:
            childs = self._get_all_fields(self)
            for child in childs:
                if isinstance(child, BaseExtField) and not isinstance(child, ExtHiddenField):
                    self.focused_field = child
                    break

#===============================================================================
class ExtPanel(BaseExtPanel):
    '''
    Панель. Kак правило этот контрол включает другие компоненты для отображения
    
    @version: 0.1
    @begin_designer
    {title: "Panel"
    ,ext_class: "Ext.Panel"
    ,xtype: "panel"
    ,attr: [{
        ext_attr: "padding"
        ,py_attr: "padding" 
    },{
        ext_attr: "collapsible"
        ,py_attr: "collapsible"
    },{
        ext_attr: "baseCls"
        ,py_attr: "base_cls"
    },{
        ext_attr: "bodyCls"
        ,py_attr: "body_cls"
    },{
        ext_attr: "anchor"
        ,py_attr: "anchor"
    },{
        ext_attr: "autoLoad"
        ,py_attr: "auto_load"
    },{
        ext_attr: "split"
        ,py_attr: "split"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-panel.js'
        self.padding = None
        self.collapsible = False
        self.border = True
        self.body_border = True

        # TODO: для чего нужен следующий атрибут?
        # Похоже он бы в прошлых версиях и его убрали в 3.3
        # Остается поддерживать для полной совместимости
        self.split = False
        self.collapse_mode = None
        self.collapsible = False
        self.collapsed = False
        
        self.base_cls = ''
        self.body_cls = ''
        self.anchor = ''
        self.auto_load = None
        self.init_component(*args, **kwargs)
    
    def render_base_config(self):
        super(BaseExtPanel, self).render_base_config()
        self._put_config_value('padding', self.padding)
        self._put_config_value('collapsible', self.collapsible)
        self._put_config_value('split', self.split)
        self._put_config_value('baseCls', self.base_cls)
        self._put_config_value('bodyCls', self.body_cls)
        self._put_config_value('anchor', self.anchor)
        self._put_config_value('autoLoad', self.auto_load)
        self._put_config_value('collapseMode', self.collapse_mode)
        self._put_config_value('collapsible', self.collapsible)
        self._put_config_value('collapsed', self.collapsed)
        self._put_config_value('border', self.border)
        self._put_config_value('bodyBorder', self.body_border)

    
    @property
    def items(self):
        return self._items

#===============================================================================
class ExtTitlePanel(ExtPanel):
    '''
    Расширенная панель с возможностью добавления контролов в заголовок.
    
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTitlePanel, self).__init__(*args, **kwargs)
        self.template = "ext-panels/ext-title-panel.js"
        self.__title_items = TypedList(type=ExtUIComponent, on_after_addition=
            self._on_title_after_addition, on_before_deletion=
            self._on_title_before_deletion, on_after_deletion=
            self._on_title_after_deletion)
        self.init_component(*args, **kwargs)

    def _update_header_state(self):
        # Заголовок может быть только в том случае, если есть текстовое значени,
        # либо имеются компоненты
        self.header = self.title or (not self.title and len(self.__title_items))

    def _on_title_after_addition(self, component):
        # Событие вызываемое после добавления элемента в заголовок
        self.items.append(component)
        self._update_header_state() 

    def _on_title_before_deletion(self, component):
        # Событие вызываемое перед удалением элемента из заголовка
        self.items.remove(component)

    def _on_title_after_deletion(self, success):
        # Событие вызываемое после удаления элемента из заголовка
        self._update_header_state()

    def t_render_items(self):
        """Дефолтный рендеринг вложенных объектов."""
        return ",".join([item.render() for item in self._items if
                         item not in self.__title_items])

    def t_render_title_items(self):
        """Дефолтный рендеринг вложенных объектов заголовка."""
        return ",".join([item.render() for item in self.__title_items])

    @property
    def title_items(self):
        return self.__title_items

#===============================================================================
class ExtTabPanel(BaseExtPanel):
    '''
    Класс, отвечающий за работу TabPanel
    
    @version: 0.1
    @begin_designer
    {title: "Tab panel"
    ,ext_class: "Ext.TabPanel"
    ,xtype: "tabpanel"
    ,attr: [{
        ext_attr: "enableTabScroll"
        ,py_attr: "enable_tab_scroll" 
    },{
        ext_attr: "items"
        ,py_attr: "tabs"
    }]}
    @end_designer
    '''
    def __init__(self, *args, **kwargs):
        super(ExtTabPanel, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-tab-panel.js'
        self.enable_tab_scroll = True
        self.border = True
        self.body_border = True
        self._items = TypedList(type=ExtPanel)
        self.init_component(*args, **kwargs)
    
    def add_tab(self, **kwargs):
        panel = ExtPanel(**kwargs)
        self.tabs.append(panel)
        return panel

    @property
    def tabs(self):
        return self._items

    # FIXME: Почему два одинаковых свойства??
    @property
    def items(self):
        return self._items
    
#===============================================================================    
class ExtFieldSet(ExtPanel):
    '''
    Объеденяет внутренние элементы и создает рамку для остальных контролов
    
    @version: 0.1
    @begin_designer
    {title: "Field set"
    ,ext_class: "Ext.form.FieldSet"
    ,xtype: "fieldset"
    ,attr: [{
        ext_attr: "checkboxToggle"
        ,py_attr: "checkboxToggle" 
    },{
        ext_attr: "collapsible"
        ,py_attr: "collapsible"
    }]}
    @end_designer
    '''
    checkboxToggle = False
    collapsible = False
    
    def __init__(self, *args, **kwargs):
        super(ExtFieldSet, self).__init__(*args, **kwargs)
        self.template = 'ext-panels/ext-fieldset.js'
        self.checkboxToggle = False
        self.collapsed = False
        self.init_component(*args, **kwargs)
