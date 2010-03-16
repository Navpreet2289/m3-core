#coding: utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from base import BaseExtContainer
from m3.ui.ext import render_component

class ExtContainer(BaseExtContainer):
    def __init__(self, *args, **kwargs):
        super(ExtContainer, self).__init__(*args, **kwargs)
        self.template = 'ext-containers/ext-container.js'
        self.__items = []
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)
    
    def render_items(self):
        return ','.join([item.render() for item in self.__items])
    
    def __get_items(self):
        return self.__items
    
    def __set_items(self,items):
        self.items = items
        
    items = property(__get_items, __set_items)
        

