#coding:utf-8
'''
Created on 25.05.2011

@author: prefer
'''

import threading
import inspect

from django.conf import settings
from django.utils.importlib import import_module


class EntityCache(object):
    '''
    Загружает и хранит список 
    '''
    
    _loaded = False
    _write_lock = threading.RLock()
    _entities = []
    
    @classmethod
    def populate(cls):
        '''
        Собирает в отдельном потоке все сущности из установленных приложений с 
        названием schema
        '''
        if not cls._loaded:
            with cls._write_lock:
                for app_name in settings.INSTALLED_APPS:
                    try:
                        module = import_module('.schema', app_name)
                    except ImportError, err:
                        if 'No module named' not in err.args[0]:
                            raise
                        continue
                                        
                    entities_module = []
                    for _, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and hasattr(obj, '__module__') and obj.__module__ == module.__name__:
                            # Чтобы не было кроссимпорта!
                            if 'BaseEntity' in [x.__name__ for x in obj.__bases__]:
                                entities_module.append(obj)
                    
                    cls._entities.extend(entities_module)

                cls._loaded = True
                
                
    @classmethod        
    def get_entities(cls):
        '''
        Возвращает список
        '''
        cls.populate()        
        return cls._entities
    
    @classmethod
    def get_entity(cls, name):
        '''
        Возвращает схему по имени класса
        '''
        cls.populate()
        for entitiy in cls._entities:
            if entitiy.__name__ == name:
                return entitiy
        