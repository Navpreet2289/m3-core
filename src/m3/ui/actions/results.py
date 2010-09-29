#coding: utf-8
'''
Результаты выполнения действий

@author: akvarats
'''

import threading
import re
import json
import inspect
import time
import datetime
import uuid # для генерации уникальных идентификаторов

from django.conf import settings
from django.utils.importlib import import_module
from django.utils.datastructures import MultiValueDict
from django import http

from m3.helpers.datastructures import MutableList
from m3.core.json import M3JSONEncoder
from m3.helpers import ui as ui_helpers
from m3.ui.ext.base import BaseExtComponent

from context import ActionContext

class ActionResult(object):
    '''
    Класс описывает результат выполнения Action'а
    
    Данный класс является абстрактным.
    '''
    
    def __init__(self, data = None, http_params = {}):
        '''
        @param data: данные, на основе которых будет сформирован результат выполнения действия. 
                     Тип объекта, передаваемого через data зависит от дочернего результата
        @param http_params: параметры, которые будут помещены ответ сервера 
        '''
        self.data = data
        self.http_params = http_params
        
    def get_http_response(self):
        '''
        Возвращает объект django.http.HttpResponse, соответствующий данном результату выполнения действия
        '''
        raise NotImplementedError()
    
    def process_http_params(self, response):
        for k, v in self.http_params.items():
            response[k] = v
        return response
              
        
    
class PreJsonResult(ActionResult):
    '''
    Результат выполнения операции в виде, например, списка объектов, 
    готовых к сериализации в JSON формат и отправке в response.
    Для данного класса в self.data храниться список некоторых объектов. 
    Метод self.get_http_response выполняет сериализацию этих данных в строковый формат.
    dict_list - Указываются объекты и/или атрибуты вложенных объектов для более глубокой сериализации.
    '''
    def __init__(self, data = None, secret_values = False, dict_list = None):
        super(PreJsonResult, self).__init__(data)
        self.secret_values = secret_values
        self.dict_list = dict_list 
    
    def get_http_response(self):
        encoder = M3JSONEncoder(dict_list = self.dict_list)
        result = encoder.encode(self.data)
        response = http.HttpResponse(result, mimetype='application/json')
        if self.secret_values:
            response['secret_values'] = True
        return response

class JsonResult(ActionResult):
    '''
    Результат выполнения операции в виде готового JSON объекта для возврата в response.
    Для данного класса в self.data храниться строка с данными JSON объекта.
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data, mimetype='application/json')

class ExtGridDataQueryResult(ActionResult):
    '''
    Результат выполнения операции, который выдает данные в формате, пригодном для 
    отображения в гриде
    '''
    def __init__(self, data=None, start = -1, limit = -1):
        super(ExtGridDataQueryResult, self).__init__(data)
        self.start = start
        self.limit = limit
        
    def get_http_response(self):
        return http.HttpResponse(ui_helpers.paginated_json_data(self.data, self.start, self.limit))

class HttpReadyResult(ActionResult):
    '''
    Результат выполнения операции в виде готового HttpResponse. 
    Для данного класса в self.data храниться объект класса HttpResponse.
    '''
    def get_http_response(self):
        return self.data
    
class TextResult(ActionResult):
    '''
    Результат, данные которого напрямую передаются в HttpResponse
    '''
    def get_http_response(self):
        return http.HttpResponse(self.data)


class ExtAdvancedTreeGridDataQueryResult(ActionResult):
    '''
    Результат выполнения операции в формате, удобным для отображения в 
    Ext.m3.AdvancedTreeGrid
    '''
    def __init__(self, data=None, start = -1, limit = -1):
        super(ExtAdvancedTreeGridDataQueryResult, self).__init__(data)
        self.start = start
        self.limit = limit
    
    def get_http_response(self):
        return http.HttpResponse(ui_helpers.mptt_json_data(self.data, 
                                                           self.start, 
                                                           self.limit),
                                 mimetype='application/json')

#===============================================================================
# Результаты выполнения операции с заданным контекстом 
#===============================================================================

class BaseContextedResult(ActionResult):
    '''
    Абстрактный базовый класс, который оперирует понятием результата 
    выполнения операции, 'отягощенного некоторым контектом'
    '''
    def __init__(self, data = None, context = None, http_params = {}):
        super(BaseContextedResult, self).__init__(data, http_params)
        self.set_context(context)
            
    def set_context(self, context):
        if isinstance(context, ActionContext):
            # в случае если задан реальный результат выполнения операции, то его и регистрируем
            self.context = context
        else:
            # иначе пытаемся построить ActionContext на основе переданного объекта context
            self.context = ActionContext(context)
    

class ExtUIComponentResult(BaseContextedResult):
    '''
    Результат выполнения операции, описанный в виде отдельного компонента пользовательского интерфейса.
    В self.data хранится некоторый наследник класса m3.ui.ext.ExtUiComponent.
    Метод get_http_response выполняет метод render у объекта в self.data.
    '''
    def get_http_response(self):
        self.data.action_context = self.context
        return http.HttpResponse(self.data.render())
    
        

class ExtUIScriptResult(BaseContextedResult):
    '''
    По аналогии с ExtUiComponentResult, представляет собой некоторого наследника класса ExtUiComponent.
    Единственное отличие заключается в том, что get_http_response должен сформировать
    готовый к отправке javascript. Т.е. должен быть вызван метод self.data.get_script()
    '''
    def __init__(self, data = None, context = None, http_params = {}, secret_values = False):
        super(ExtUIScriptResult, self).__init__(data, context, http_params)
        self.secret_values = secret_values
    
    def get_http_response(self):
        self.data.action_context = self.context
        response = http.HttpResponse(self.data.get_script())
        
        response = self.process_http_params(response)
        
        if self.secret_values:
            response['secret_values'] = True
        return response
    
class OperationResult(ActionResult):
    '''
    Результат выполнения операции, описанный в виде Ajax результата ExtJS: success или failure.
    
    @param success: True в случае успешного завершения операции, False - в противном случае
    @param message: сообщение, поясняющее результат выполнения операции
    @param code: текст javascript, который будет выполнен на клиенте в результате обработки результата операции
    '''
    def __init__(self, success = True, code = '', message = '', *args, **kwargs):
        super(OperationResult, self).__init__(*args, **kwargs)
        # Результат выполнения операции: успех/неудача
        self.success = success
        # Сообщение об ошибке выводимое при неудаче
        self.message = message
        # Произвольный JS код, который выполняется в любом случае если задан
        self.code = code
    
    @staticmethod
    def by_message(message):
        '''
        Возвращает экземпляр OperationResult построенный исходя из сообщения message.
        Если операция завершилась успешно, то сообщение должно быть пустым.
        
        @deprecated: Непонятно что это такое..
        '''
        result = OperationResult(success = True)
        if message:
            result.success = False
            result.message = message
        return result
    
    def get_http_response(self):
        '''
        Возвращает объект HttpResponse, соответствующий данному результату выполнения операции
        '''
        result = {}
        result['message'] = self.message
        result['success'] = True if self.success else False
        result = json.JSONEncoder().encode(result)
        
        # Вставляем функцию прямо в JSON без кодирования
        if self.code:
            self.code = self.code.strip()
            if self.code[len(self.code)-2:len(self.code)] == '()':
                code = ' ,"code": %s' % self.code[:-2]
            else:
                code = ' ,"code": %s' % self.code
            result = result[:-1] + code + result[-1]
        
        repsonse = http.HttpResponse(result)
        repsonse = self.process_http_params(repsonse)
        return repsonse