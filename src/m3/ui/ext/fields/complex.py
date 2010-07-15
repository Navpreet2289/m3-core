#coding:utf-8
'''
Created on 27.02.2010

@author: prefer
'''

from m3.ui import actions

from base import BaseExtField
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.misc import ExtJsonStore
from m3.ui.ext.fields.base import BaseExtTriggerField


class ExtDictSelectField(BaseExtTriggerField):
    '''
    Поле с выбором из справочника
    
    Пример конфигурирования поля
    
    '''
    def __init__(self, *args, **kwargs):
        super(ExtDictSelectField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-dict-select-field.js'
        self.hide_trigger = True 
        self.min_chars = 2 # количество знаков, с которых начинаются запросы на autocomplete
        
        self.set_store(ExtJsonStore())
        #self.handler_change = 'onChange'
        self.width = 150
        self.value = None
        
        #self.read_only = False
        self.editable = False
        self.ask_before_deleting = None
        self.url = None
        self.autocomplete_url = None
        self.value_field = 'id'     # это взято из магического метода configure_edit_field из mis.users.forms 
        self.query_param = 'filter' # и это тоже взято оттуда же
        
        self.display_field = 'name' # по умолчанию отображаем значение поля name
        
        # Из-за ошибки убраны свойства по умолчанию
        self.total = 'total'
        self.root = 'rows'
        
        self.init_component(*args, **kwargs)
        # По умолчанию 20 - ширина двух кнопок
        # Чтобы компонент умещался в передаваемую ширину
        #self.width -= 20
        
        # внутренние переменные
        self.__action_select = None
        self.__action_data = None
    
    #===========================================================================
    # Экшены для управления процессом работы справочника  
    #===========================================================================
    
    #===========================================================================
    #  Получение окна выбора значения
    def _get_action_select(self):
        return self.__action_autocomplete
    
    def _set_action_select(self, value):
        self.__action_autocomplete = value
        if isinstance(value, actions.Action):
            self.autocomplete_url = value.absolute_url()
    action_select = property(_get_action_select, _set_action_select, doc='Действие, которое используется для получения окна выбора значения')
    #===========================================================================
    
    #==========================================================================
    # Получение списка для получения списка значений (используется в автозаполнении)
    def _get_action_data(self):
        return self.__action_data
    def _set_action_data(self):
        return self.__action_data
    action_data = property(_get_action_data, _set_action_data, doc='Действие для получения списка строковых значений для ')
    #==========================================================================
        
    
    @property
    def url(self):
        return self.__url
    
    @url.setter
    def url(self, value):
        self.__url = value
        
    @property
    def autocomplete_url(self):
        return self.__autocomplete_url
    
    @autocomplete_url.setter
    def autocomplete_url(self, value):
        if value:
            self.editable = True
            self.get_store().url = value
        self.__autocomplete_url = value
        
    @property
    def value(self):
        return self.__value
    
    @value.setter
    def value(self, val):
        self.__value = val
        
    def configure_by_dictpack(self, pack, controller):
        '''
        Метод настройки поля выбора из справочника на основе 
        переданного ActionPack работы со справочниками
        '''   
        registered_pack = controller.find_pack(pack)
        if not registered_pack:
            raise Exception('Pack %s not found in controller %s' % (controller, pack))
        self.url = registered_pack.get_select_url()
        self.autocomplete_url = registered_pack.rows_action.get_absolute_url()
        self.bind_pack = registered_pack # TODO: можно ли обойтись без bind_back?
    
    
#    @property
#    def pack(self):
#        return self.__pack
#        
#    @pack.setter
#    def pack(self, ppack):
#        self.__pack = ppack
#        self.url = ppack.absolute_url()
        
        
    @property
    def total(self):
        return self.get_store().total_property
    
    @total.setter
    def total(self, value):
        self.get_store().total_property = value
        
    @property
    def root(self):
        return self.get_store().root
    
    @root.setter
    def root(self, value):
        self.get_store().root = value
        
        
class ExtSearchField(BaseExtField):
    '''Поле поиска'''
    def __init__(self, *args, **kwargs):
        super(ExtSearchField, self).__init__(*args, **kwargs)
        self.template = 'ext-fields/ext-search-field.js'
        self.query_param = None
        self.empty_text =None
        self.component_for_search = None
        self.init_component(*args, **kwargs)
    