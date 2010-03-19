#coding:utf-8
'''
Created on 10.03.2010

@author: akvarats
'''

from django.db import models
from m3.workflow.exceptions import ImproperlyConfigured

class Workflow(object):
    '''
    Базовый класс рабочих процессов
    '''
    
    def __init__(self, *args, **kwargs):
        self.start_step = WorkflowStartStep()
        self.end_step = WorkflowEndStep()
        self.steps=[]
        
        # уникальный по системе идентификатор рабочего процесса. 
        # это просто текстовая строка
        self.id = ''
    
    @classmethod
    def meta_class_name(cls):
        '''
        Возвращает имя класса (без префикса модуля)
        '''
        return cls.__name__
    
    @classmethod
    def meta_full_class_name(cls):
        '''
        Возвращает полное квалифицирующее имя класса рабочего потока
        '''
        return cls.__module__ + '.' + cls.__name__
    
    @classmethod    
    def meta_dbtable(cls):
        '''
        Возвращает название таблицы для текущего рабочего потока 
        '''
        try:
            return cls.Meta.db_table
        except:
            raise ImproperlyConfigured(u'Для класса рабочего потока ' + cls.meta_full_class_name() + ' не задан атрибут Meta.db_table')
                
class WorkflowModel(models.Model):
    '''
    Базовый класс для хранимых моделей рабочих потоков
    '''
    class Meta:
        abstract = True

class WorkflowStepModel(models.Model):
    '''
    Базовый класс для хранимых моделей шагов рабочих процессов
    '''
    class Meta:
        abstract = True
        
class WorkflowWSOModel(models.Model):
    class Meta:
        abstract = True

class WorkflowDocModel(models.Model):
    class Meta:
        abstract = True
        
#===============================================================================
# Непонятно что
#===============================================================================

class WorkflowWSObject(object):
    '''
    #TODO: Пока не понятно что это?
    '''
    def __init__(self, wso_class, wso_field):
        '''
        @param wso_class: задает класс модели, которая будет входить в рабочий набор потока
        @param wso_field: задает имя поля, которое используется для храненения идентификатора 
                          соответствующего объекта в моделе WorkflowWSORefModel.
        '''
        self.wso_class = wso_class
        self.wso_field = wso_field

class WorkflowDocument(object):
    '''
    #TODO: Пока не понятно что это?
    '''
    def __init__(self, document_class, document_db_subname):
        self.document_class = document_class
        self.document_db_subname = document_db_subname
    
#===============================================================================
# Шаги рабочего процесса
#===============================================================================
    
class WorkflowStep(object):
    def __init__(self, id='', name='', *args, **kwargs):
        self.id = id # уникальный в пределах одного рабочего процесса идентификатор шага
        self.__name = name if name.strip() else self.id

    #===============================================================================
    # Свойство "Наименование"
    #===============================================================================
    def __get_name(self):
        return self._name;
    
    name = property(__get_name)
    
class WorkflowStartStep(WorkflowStep):
    def __init__(self,):
        super(WorkflowStartStep, self).__init__(id='new', name='Новый')
        
class WorkflowEndStep(WorkflowStep):
    def __init__(self):
        super(WorkflowEndStep, self).__init__(id='closed', name='Закрыто')
    
#===============================================================================
# Переходы рабочего процесса
#===============================================================================
class WorkflowTransition(object):
    def __init__(self, from_step_id, to_step_id, *args, **kwargs):
        self.from_step = None
        self.to_step = None