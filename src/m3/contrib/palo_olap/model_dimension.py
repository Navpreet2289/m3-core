#coding:utf-8
from django.db import models, connection
import datetime
import copy
from m3.contrib.palo_olap.server_api.server import PaloServer
from m3.contrib.palo_olap.server_api.dimension import ELEMENT_TYPE_CONSOLIDATED, ELEMENT_TYPE_NUMERIC
import threading
from dimension import BasePaloDimension

class ModelBassedPaloDimension(BasePaloDimension):
    '''
    класс для описания дименшена на основании модели
    '''
    model = None #моедель на основании котороу бедм стороить дименшен
    all_name = None #имя для консолидированного элемента (все элементы) если ноне то сгенерируется автоматически
    unknow_name = u'Неизвестно' #задает имя элемента НЕИЗВЕСТО если задать None то создавать не будет
    name_field = 'name' #поле в котором лежит имя или можно перекрыть функцию get_name которая будет возвращать имя в этом случае не забудь перекрыть функции get_not_unique_names
    check_unique_name = True #проверять уникальность имени (черещ процедуру get_not_unique_names
    make_tree = False #надо ли создавать древовидную структуру (если до то надо определить get_parent(obj), get_childrens(obj) если модель не mptt
     
    
    _processed = False #обработано ли измерения (выгружены все свежие данные)
    _store_model = None #автогенерируемая модель для хранения доп атрибутов для элементов основно модели
    _consolidate_store_model = None #автогенерируемая модель для хранения консолидированных элементов модели
    _delete_lock = threading.Lock() #блокировка чтоб во время обработки никто не удалял измерение
    _change_lock = threading.Lock() #блокировка чтоб во время обработки никто не изменил измерение
    _not_unique_name = {}
    
    @classmethod
    def register(cls):
        '''
        зарегистрировать модель, делает такое:
        - создание динамических моделей на базе BaseStoreRelatedModel
        - подключение к сигналам post_save, post_delete целевой модели
        '''
        cls.create_store_model()
        cls.create_consolidate_store_model()
        cls.connect_signals()
 
        
    @classmethod
    def connect_signals(cls):
        models.signals.post_save.connect(cls.post_save_model, sender=cls.model)
        models.signals.pre_delete.connect(cls.pre_delete_model, sender=cls.model)
    
    @classmethod
    def get_store_related_name(cls):
        '''
        получить атрибут related_name для связанной модели
        '''
        res = cls.__name__ + 'Store'
        return res.lower()
    
    @classmethod
    def create_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало и информации о изменнии элементов целевой модели
        созданеи ведеться путем наследования от BaseStoreRelatedModel и добавление instance = ForeignKey
        '''
        model_name = cls.__name__ + 'Store' 
        attrs = dict()
        attrs['__module__'] =  cls.__module__
        attrs['instance'] = models.OneToOneField(cls.model, null=True, related_name = cls.get_store_related_name())
        if cls.make_tree:
            #для древовидной структыры нам надо помнить родителя т.к. если эелмент переносят в другую ветку то из какой перенесли мы узнаем отсюда
            attrs['instance_parent'] = models.ForeignKey(cls.model, null=True, related_name=cls.get_store_related_name() + '_parent')  
        cls._store_model = type(model_name, (BaseStoreRelatedModel,), attrs)
        
    @classmethod
    def create_consolidate_store_model(cls):
        '''
        создание связанной модели для хранние идишники пало для консолидированных элементов
        созданеи ведеться путем наследования от BaseConsolidateStoreModel 
        '''
        model_name = cls.__name__ + 'ConsolidateStore' 
        attrs = dict(__module__=cls.__module__)
        cls._consolidate_store_model = type(model_name, (BaseConsolidateStoreModel,), attrs)
        
    def get_parent(self, obj):
        '''
        возвращает ид родителя (ид модели)
        если make_tree стоит то реальный родитель
        иначе None
        '''
        if self.make_tree:
            assert hasattr(obj, 'parent_id')
            return obj.parent_id
        else:
            return None
            
    def get_children(self, obj):
        '''
        возвращает пало идишники детей
        '''
        assert self.make_tree
        assert callable(obj.get_children)
        children = self.model.objects.filter(parent=obj).values('pk')
        q = self._store_model.objects.filter(instance__in=children)
        return [o.palo_id for o in q]
        
    def clear(self):
        '''
        чистим дименшен и все модели
        '''
        super(ModelBassedPaloDimension, self).clear()
        self._store_model.objects.all().delete()
        self._consolidate_store_model.objects.all().delete()
        
    
    def process(self, with_clear=False):
        '''
        обработка измерения (загрузка в palo server)
        '''

        super(ModelBassedPaloDimension, self).process(with_clear)
        
        if self.check_unique_name:
            self._not_unique_name = self.get_not_unique_names()
        result = dict()
        self.process_base_elements()
        result[u'Новых'] = self.process_new_items()
        result[u'Удаленных'] = self.process_deleted_items()
        result[u'Измененных'] = self.process_changed_items()
        self.after_process()
        
        return result
    
    def get_or_create_consolidate_element(self, name, type = ELEMENT_TYPE_CONSOLIDATED):
        try:
            return self._consolidate_store_model.objects.get(name=name).palo_id
        except self._consolidate_store_model.DoesNotExist:
            id = self._dim.create_element(name, type)
            st = self._consolidate_store_model()
            st.palo_id = id
            st.name = name
            st.save()
            return id
    
    def process_base_elements(self):
        '''
        создает или находит основные консолидайт эелменты "ВСЕ", "НЕ УКАЗАН"
        '''
        self._all_id = self.get_or_create_consolidate_element(self.all_name or u'Все %s' % self.name.lower())
        if self.unknow_name:
            self._unknown_id = self.get_or_create_consolidate_element(self.unknow_name, ELEMENT_TYPE_NUMERIC)
    
    def get_name(self, obj):
        '''
        возвращает имя элемента или по фиелду или по функции
        '''
        name = getattr(obj,self.name_field)        
        if self._not_unique_name.has_key(name):
            name = self.regenerate_name(obj)
        name = name.strip()
        if name.find(',')>=-1:
            name = u'"%s"' % name
        return name
    
    def get_not_unique_names(self):
        '''
        возвращает список неуникальных имен
        '''
        query = self.get_model_query()
        query = query.values(self.name_field).annotate(cnt=models.Count(self.name_field))
        query = query.filter(cnt__gt=1)
        res = {}
        for o in query:
            res[o[self.name_field]] = o['cnt']

        return res
    
    def regenerate_name(self, obj):
        '''
        регенерирует имя для элемента у которого имя оказалось в списке дублей
        '''
        return '%s (%i)' % (getattr(obj, self.name_field), obj.id)

    def get_model_query(self):
        '''
        возвращает квари элементв которого будут обрабатываться (загрузаться удаляться и прочее)
        '''
        return self.model.objects.all()
    
    
    def process_new_items(self):
        '''
        обработка новых элементов измерения (загрузка в palo server)
        '''
        self.__class__._delete_lock.acquire()
        try:
            append_to_consolidate = dict() #писок идишников модели (не пола) к которым надо добалвять идишники пало 
            #удалим все записи без кода пало
            uses = self._store_model.objects.values('instance_id')
            query = self.get_model_query()
            query = list(query.exclude(pk__in=uses).order_by('pk'))
            cached_id = dict() #кэш для хранения связе ид - пало-ид
            if query:
                names = map(self.get_name, query)
                range_id = self._dim.create_elements(names)
                #запомним созданные идишники
                for i, obj in enumerate(query):
                    st = self._store_model()
                    st.instance = obj
                    st.processed = True
                    st.palo_id = range_id[i]
                    st.last_action_time = datetime.datetime.now()
                    if self.make_tree:
                        #запомним родителя на момент обработки (чтоб потом знать из какого элемента его удлалили
                        st.instance_parent_id = self.get_parent(obj)
                    st.save()
                    cached_id[st.instance_id] = st.palo_id
                    #отметим что надо пересчитать консидайшен эелементы
                    parent = self.get_parent(obj)
                    if append_to_consolidate.has_key(parent):
                        append_to_consolidate[parent].append(st.palo_id)
                    else:
                        append_to_consolidate[parent] = [st.palo_id,]
                        
                #ну вот всех добавили теперь обработаем добавление в косолидейшен элементы
                for cons, childs in append_to_consolidate.items():
                    if cons is None:
                        cons_id = self.get_all_consolidate_element_id()
                    else:
                        cons_id = cached_id.get(cons)
                        if not cons_id:
                            cons_id = self.get_palo_id(cons) 
                    self._dim.append_to_consolidate_element(cons_id, childs)
            return len(query)
        finally:
            self.__class__._delete_lock.release()
            
    def get_all_consolidate_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        return self._all_id
            
    def get_unknown_element_id(self):
        '''
        возвращает пало ид консолидайт элемента "ВСЕ"
        '''
        assert self._processed
        return self._unknown_id
    
    def get_palo_id(self, id):
        '''
        ковертирует ид моделив в пало ид
        '''
        return self._store_model.objects.get(instance=id).palo_id
    
    def process_deleted_items(self):
        '''
        обработка удаленных элементов измерения (удаление из palo server)
        '''
        query = self._store_model.objects.filter(palo_id__isnull=False, deleted=True, last_action_time__lte=datetime.datetime.now())
        cnt = 0
        if query:
            for obj in query:
                self._dim.deleteElement(obj.palo_id)
                cnt += 1
            query.update(palo_id=None, processed=True)
        return cnt
        
    def process_changed_items(self):
        '''
        обработка измененных элементов измерения (удаление из palo server)
        '''
        start_proc_time = datetime.datetime.now()
        query = self.get_model_query()
        st = self.get_store_related_name()
        filter = {'%s__palo_id__isnull' % st :False,
                  '%s__processed' % st :False,
                  }
        query = query.select_related(st).filter(**filter)
        
        changed_parents = list() #список идишников модели (не пола) у ктороых поменялись родители

        query = list(query)
        if query:
            for obj in query:
                palo_id = getattr(obj, st).palo_id
                self._dim.renameElement(palo_id, self.get_name(obj))
                if self.make_tree:
                    #запомним родителей которых надо пересчитывать
                    new_parent = self.get_parent(obj)
                    old_parent = getattr(obj, st).instance_parent_id
                    if new_parent <> old_parent:
                        #элемент перенесли запомним нового и старого родителя
                        changed_parents.append(new_parent) 
                        changed_parents.append(old_parent)
                        st = self._store_model.objects.get(id=getattr(obj, st).id)
                        st.instance_parent_id = new_parent
                        st.save() 
            #отметим что обработали    
            q = self._store_model.objects.filter(palo_id__isnull=False, processed=False, last_action_time__lte=start_proc_time)
            q.update(processed=True)
            for id in changed_parents:
                self.refresh_childrens(id)
        return len(query)
        
    def refresh_childrens(self, id):
        '''
        обновить детей у консолидайшен элемента по ид модели (не пало)
        '''
        obj = self.model.objects.get(pk=id)
        palo_id = self.get_palo_id(id)
        childs = self.get_children(obj)
        self._dim.replace_consolidate_element(palo_id, childs)
    
    @classmethod
    def post_save_model(cls, instance, **kwargs):
        '''
        обработка сигнала сохранения связанной модели
        '''
        cls._change_lock.acquire()
        try:
            q = cls._store_model.objects.filter(instance=instance)
            q.update(processed = False, last_action_time=datetime.datetime.now())
        finally:
            cls._change_lock.release()

    @classmethod
    def pre_delete_model(cls, instance, **kwargs):
        '''
        обработка сигнала удаления целевой модели
        '''
        cls._delete_lock.acquire()
        try:
            q = cls._store_model.objects.filter(instance=instance)
            q.update(processed = False, 
                     deleted = True, 
                     last_action_time=datetime.datetime.now(),
                     instance=None)
            if cls.make_tree:
                #обработаем элементы чей родитель он был
                q = cls._store_model.objects.filter(instance_parent=instance)
                q.update(instance_parent=None)
                
        finally:
            cls._delete_lock.release()
            

class BaseStoreRelatedModel(models.Model):
    '''
    модель для хранения связанных атрибутов для элементов выбранной модели
    наследники модели генерируеться автоматически
    '''
#    instance = models.OneToOneField('self', null=True, related_name=...) #этот атрибут сгенерируеться автоматически
    palo_id = models.IntegerField(null=True)
    processed = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    last_action_time = models.DateTimeField(null=True)
    class Meta:
        abstract = True


class BaseConsolidateStoreModel(models.Model):
    '''
    модель для хранения консолидированнх элементов
    всегда имспользуется для хранения элементов ВСЕ, Не задан 
    '''
#    instance = models.ForeignKey('self') #этот атрибут сгенерируеться автоматически
    palo_id = models.IntegerField(null=True)
    name = models.CharField(max_length=250)
    class Meta:
        abstract = True

