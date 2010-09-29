#coding:utf-8
'''
Модуль, реализущий работу с контекстом выполнения операции

@author: akvarats
'''

import datetime

class ActionContextDeclaration(object):
    '''
    Класс, который декларирует необходимость наличия определенного параметра в объекте контекста
    '''
    def __init__(self, name='', default=None, type=None, required=False, verbose_name = '', *args, **kwargs):
        '''
        Создает экземпляр
        '''
        self.name = name
        self.default = default
        self.required = required
        self.type = type
        self.verbose_name = verbose_name
        
    def human_name(self):
        '''
        Выводит человеческое название параметра
        '''
        return self.verbose_name if self.verbose_name else self.name

class ActionContext(object):
    '''
    Контекст выполнения операции, восстанавливаемый из запроса.
    '''
    class RequiredFailed(Exception):
        '''
        Исключительная ситуация, которая выбрасывается в случае
        если фактическое наполнение контекста действия не соответствует
        описанным правилам
        '''
        def __init__(self, reason):
            self.reason = reason
    
    class ValuesList():
        '''
        Класс для описания параметров, которые будут передаваться в виде 
        списка значений, разделенных определенным символом
        '''
        def __init__(self, separator=',', type=int):
            # разделитель элементов
            self.separator = separator
            # тип, к которому будут преобразовываться эл-ты списка
            self.type = type
            
    def __init__(self, obj=None):
        '''
        В зависимости от типа obj выполняем построение объекта контекста действия
        '''
        pass
    
    def convert_value(self, raw_value, arg_type):
        ''' Возвращает значение преобразованное в заданный формат '''
        value = None
        if arg_type == int:
            value = int(raw_value)
            
        elif arg_type in [str, unicode]:
            value = unicode(raw_value)
            
        elif arg_type == datetime.datetime:
            # Дата может прийти либо в Немецком формате, 
            # либо в дефолтном ExtJS формате 2010-06-21T00:00:00
            if 'T' in raw_value:
                value = datetime.datetime.strptime(raw_value[:10], '%Y-%m-%d')
            else:
                value = datetime.datetime.strptime(raw_value, '%d.%m.%Y')
            
        elif arg_type == datetime.date:
            if 'T' in raw_value:
                value = datetime.datetime.strptime(raw_value[:10], '%Y-%m-%d')
            else:
                value = datetime.datetime.strptime(raw_value, '%d.%m.%Y')
            value = value.date()
            
        elif arg_type == datetime.time:
            d = datetime.datetime.strptime(raw_value, '%H:%M')
            value = datetime.time(d.hour, d.minute, 0)
        elif arg_type == bool:
            value = raw_value in ['true', 'True', 1, '1', 'on', True]
        elif isinstance(arg_type, ActionContext.ValuesList):
            value = map(arg_type.type, raw_value.split(arg_type.separator))
        else:
            raise Exception('Can not convert value of "%s" in a given type "%s"' % (raw_value, arg_type))
        
        return value
    
    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов согласно переданному request
        '''
        params = {}
        if rules:
            for rule in rules:
                params[rule.name] = [rule.type, False] # [тип параметра; признак того, что параметр включен в context]
        
        # переносим параметры в контекст из запроса
        for key in request.REQUEST:
            value = request.REQUEST[key]
            # Пустые параметры не конвертируем, т.к. они могут вызвать ошибку
            if not value:
                continue
            # 
            if params.has_key(key):
                value = self.convert_value(value, params[key][0])    
                # Флаг того, что параметр успешно расшифрован и добавлен в контекст
                params[key][1] = True
            setattr(self, key, value)
        
        # переносим обязательные параметры, которые не встретились в запросе
        for rule in rules if rules else []:
            if rule.required and rule.default != None and not params[rule.name][1]:
                # если параметр не передан в запросе, но
                # он является обязательным и задано значение по умолчанию,
                # то помещаем этот параметр в контекст
                setattr(self, rule.name, rule.default)
                
    def check_required(self, rules):
        '''
        Проверяет наличие обязательных параметров
        '''
        if not rules:
            return
        for rule in rules:
            if rule.required and getattr(self, rule.name, None) == None:
                raise ActionContext.RequiredFailed(rule.human_name())
    
    def json(self):
        '''
        Рендеринг контекста в виде javascript объекта
        '''
        result = ''
        for k,v in self.__dict__.items():
            if isinstance(v, bool):
                result += '"%s": "%s",' % (k, 'true' if v is True else 'false')
            elif isinstance(v, int):
                result += '"%s": %s,' % (k,v)
            elif isinstance(v, datetime.datetime):
                result += '"%s": "%s",' % (k, v.strftime('%d.%m.%Y'))
            elif isinstance(v, datetime.time):
                result += '"%s": "%s",' % (k, v.strftime('%H:%M'))
            else:
                try:
                    result += '"%s": "%s",' % (k,str(v))
                except:
                    # TODO: обрабатывать все типы параметров
                    pass
        if result:
            result = result[:-1]
        return '{' + result + '}'