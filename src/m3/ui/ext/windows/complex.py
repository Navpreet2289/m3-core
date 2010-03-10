#coding: utf-8

'''
Created on 9.03.10

@author: prefer
'''

from base import BaseExtWindow
from m3.ui.ext.controls import ExtButton
from m3.ui.ext.containers import ExtGrid, ExtGridColumn
from m3.ui.ext import render_component

class ExtDictSelectWindow(BaseExtWindow):
    def __init__(self, request, *args, **kwargs):
        super(ExtDictSelectWindow, self).__init__(*args, **kwargs)
        
        self.field_id = self.__get_field_id(request)
        self.title = u'Форма выбора значения'
        
        self.layout = 'fit'
        self.grid = ExtGrid()
        self.buttons.append(ExtButton(text = u'Выбрать'))
        self.buttons.append(ExtButton(text = u'Закрыть',
                                      handler = 'function(){Ext.getCmp("%s").close();}' % self.client_id))
             
        self.template_globals = 'ext-script/ext-button-select-window.js'  
        self.attr_id  = ''
        self.attr_text = ''
        
        self.init_component(*args, **kwargs)
    
    def render(self):
        return render_component(self) 
    
    def render_buttons(self):
        return 'buttons:[%s]' % ','.join([render_component(button) for button in self.buttons])
       
    # Свойство, отображающее grid на top_container для правильного рендеринга   
    def _set_grid(self, value):
        self.top_container = value
        self.__grid = value
    
    def _get_grid(self):
        return self.__grid
    
    grid = property(_get_grid, _set_grid)
    
    @property
    def select_dict_button(self):
        '''
            Свойство для быстрого доступа к кнопке выбора значения
        '''
        return self.buttons[0]
    
    @property
    def cancel_dict_button(self):
        '''
            Свойство для быстрого доступа к кнопке отмены значения
        '''
        return self.buttons[1]
    
    def __get_field_id(self, request):
        '''
            Инкапсуляция над выбором id текстового поля из запроса с клиента
        '''
        return request.GET.get('field_id')
    
    def set_attr(self, id='', text=''):
        '''
            Говорит о том, из какой колонки будет браться id значения, а из какого text
        '''
        self.attr_id = id
        self.attr_text = text
        