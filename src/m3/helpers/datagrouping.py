#coding:utf-8
'''
Created on 14.04.2011

@author: kirov
'''
from django.db.models import Q, Count, Avg, Max, Min, Sum

class RecordProxy(object):
    '''
    Прокси объект записи отображающей группировку
    '''
    def __init__(self, *args, **kwargs):
        self.id = 0 # ID записи в базе
        self.index = 0 # индекс записи в раскрытом дереве (заполняется при выводе)
        self.lindex = 0 # индекс записи на уровене (заполняется при выводе)
        self.indent = 0 # уровень (заполняется при выводе)
        self.is_leaf = False # признак конечной записи (больше не раскрывается) (заполняется при выводе)
        self.expanded = False # признак что элемент развернут (заполняется при выводе)
        self.count = 0 # количество дочерних узлов, если они есть
        self.init_component(*args, **kwargs)

    def init_component(self, *args, **kwargs):
        '''
        Заполняет атрибуты экземпляра значениями в kwargs, 
        если они проинициализированы ранее 
        '''
        for k, v in kwargs.items():
            assert k in dir(self) and not callable(getattr(self, k)), \
                'Instance attribute "%s" should be defined in class "%s"!' \
                % (k, self.__class__.__name__)
            self.__setattr__(k, v)

    def load(self, data):
        '''
        Загрузка записи в объект
        '''
        pass

    def calc(self):
        '''
        Пост-обработка записи, когда все реквизиты заполнены
        '''
        pass

class GroupingRecordProvider(object):
    '''
    Базовый класс провайдера данных
    '''
    proxy_class = RecordProxy
    data_sorce = None

    def __init__(self, proxy=None, data=None):
        if proxy:
            self.proxy_class = proxy
        if data is not None:
            self.data_source = data

    def get_data(self, *args, **kwargs):
        return self.data_source

    def create_record(self, *args, **kwargs):
        return self.proxy_class(*args, **kwargs)

    def reader(self, *args, **kwargs):
        pass

    def counter(self, *args, **kwargs):
        pass

    def indexer(self, *args, **kwargs):
        pass

    def get_elements(self, grouped, offset, level_index, level, begin, end, keys, aggregates, sorting):
        '''
        Основной метод получения данных
        '''
        return get_elements(grouped, offset, level_index, level, begin, end, keys, self, aggregates, sorting)

class GroupingRecordModelProvider(GroupingRecordProvider):
    '''
    Провайдер для модели
    '''
    def reader(self, *args, **kwargs):
        return read_model(*args, **kwargs)

    def counter(self, *args, **kwargs):
        return count_model(*args, **kwargs)

    def indexer(self, *args, **kwargs):
        return index_model(*args, **kwargs)

class GroupingRecordDataProvider(GroupingRecordProvider):
    '''
    Провайдер для массива
    '''
    def reader(self, *args, **kwargs):
        return read_data(*args, **kwargs)

    def counter(self, *args, **kwargs):
        return count_data(*args, **kwargs)

    def indexer(self, *args, **kwargs):
        return index_data(*args, **kwargs)


def get_elements(grouped, offset, level_index, level, begin, end, keys, data_provider, aggregates, sorting):
    # offset - смещение индекса уровня. нужно чтобы элементы имели индекс со смещением
    res = []
    all_out = False # признак того, что все необходимые элементы выведены, идет подсчет общего количества открытых элементов
    #total_len = level['count'] # общее количество элементов (в начале без учета раскрытых)
#    print 'get_elements(): grouped=%s, offset=%s, level_index=%s, level=%s, begin=%s, end=%s, keys=%s' % (grouped, offset, level_index, level, begin, end, keys)

    #необходимо узнавать индекс элемента с кодом exp['id'] в текущем уровне, при текущей сортировке и располагать элементы соответственно
    if not level.has_key('items'):
#        import pdb; pdb.set_trace();

        level['items'] = data_provider.indexer(grouped, level_index, keys + [level['id']] if level['id'] else [], level['expandedItems'], data_provider, sorting)
        for exp in level['expandedItems']:
            exp['index'] = level['items'].index(exp['id'])
        #теперь выстроим в порядке индексов
        exp_sort = sorted(level['expandedItems'], key=lambda x: x['index'])
        level['expandedItems'] = exp_sort
    # пройдемся по развернутым элементам
    i = 0
    while i < len(level['expandedItems']):
        exp = level['expandedItems'][i]

        # на текущий момент необходимо вычислить количество дочерних элементов
        if exp['count'] == -1:
            exp['count'] = data_provider.counter(grouped, level_index + 1, (keys + [level['id']] if level['id'] else []) + [exp['id']], exp['expandedItems'], data_provider)


        if all_out:
            i = i + 1
            #total_len = total_len+exp['count'] # при пробежке просто добавляем количество раскрытых 
            continue

        # 1) может диапазон уже пройден
        if end <= exp['index']:
            # выдать диапазон с begin по end
            #print '1) диапазон уже пройден'
            #print 'offset=%s, begin=%s, end=%s, exp=%s, keys=%s' % (offset, begin, end, exp, keys)
            list = data_provider.reader(grouped, offset + len(res) - begin, level_index, keys + [level['id']] if level['id'] else [], begin, end, data_provider, aggregates, sorting)
            # если выдали раскрытый элемент, то установим у него признак раскрытости
            if end == exp['index']:
                list[-1].expanded = True
            res.extend(list)
            # переходим к след. развернутому элементу
            #total_len = total_len + exp['count'] # добавим количество раскрытых элементов
            i = i + 1
            all_out = True
            continue

        # 2) может интервал переходит с предыдущего
        if begin <= exp['index'] and end > exp['index']:
            #print '2) интервал переходит с предыдущего'
            #print 'offset=%s, begin=%s, end=%s, exp=%s, keys=%s' % (offset, begin, end, exp, keys)
            # выдадим известный диапазон, а остальное продолжим искать
            list = data_provider.reader(grouped, offset + len(res) - begin, level_index, keys + [level['id']] if level['id'] else [], begin, exp['index'], data_provider, aggregates, sorting)
            # если выдали раскрытый элемент, то установим у него признак раскрытости
            list[-1].expanded = True
            res.extend(list)
            begin = exp['index'] + 1
            continue

        # 3) попадаем ли мы в раскрытый уровень
        if begin >= exp['index'] and end <= exp['index'] + exp['count']:
            #print '3) мы попадаем в раскрытый уровень'
            #print 'offset=%s, begin=%s, end=%s, exp=%s, keys=%s' % (offset, begin, end, exp, keys)
            # переходим искать на след. уровень
            list, total = get_elements(grouped, offset + len(res), level_index + 1, exp, begin - exp['index'] - 1, end - exp['index'] - 1, keys + [level['id']] if level['id'] else [], data_provider, aggregates, sorting)
            #total_len = total_len+total # добавляем количество раскрытых элементов
            res.extend(list)
            # переходим к след. развернутому элементу
            i = i + 1
            all_out = True
            continue

        # 4) если частично попадаем в раскрытый
        if begin <= exp['index'] + exp['count'] and end > exp['index'] + exp['count']:
            #print '4) частично попадаем в раскрытый'
            #print 'offset=%s, begin=%s, end=%s, exp=%s, keys=%s' % (offset, begin, end, exp, keys)
            # часть переведем искать на след. уровень, остальное продолжим
            list, total = get_elements(grouped, offset + len(res), level_index + 1, exp, begin - exp['index'] - 1, exp['count'] - 1, keys + [level['id']] if level['id'] else [], data_provider, aggregates, sorting)
            #total_len = total_len+total # добавляем количество раскрытых элементов
            res.extend(list)
            delta = end - begin - len(list)
            begin = exp['index'] + 1 # поднимем нижнюю границу до следующего после текущего элемента
            end = begin + delta#end - len(list) # сократим верхнюю границу на количество выданных элементов
            i = i + 1
            continue

        # 6) если еще не дошли
        if begin > exp['index'] + exp['count']:
            #print '6) если еще не дошли'
            #print 'offset=%s, begin=%s, end=%s, exp=%s, keys=%s' % (offset, begin, end, exp, keys)
            begin = begin - exp['count']
            end = end - exp['count']
            #total_len = total_len+exp['count'] # добавляем количество раскрытых элементов

        # переходим к след. развернутому элементу
        i = i + 1

    if level['count'] == -1:
        level['count'] = data_provider.counter(grouped, level_index, keys, level['expandedItems'], data_provider)
    # 5) выдадим из уровеня всё что осталось
    if not all_out and begin <= end and begin < level['count']:
        #print '5) выдадим из уровеня всё что осталось'
        #print 'begin=%s, end=%s, level[count]=%s, len(res)=%s, offset=%s, keys=%s' % (begin,end,level['count'], len(res), offset, keys)
        if end > level['count'] - 1:
            end = level['count'] - 1
        list = data_provider.reader(grouped, offset + len(res) - begin, level_index, keys + [level['id']] if level['id'] else [], begin, end, data_provider, aggregates, sorting)
        res.extend(list)

    # можно уже не считать total выше
    total_len = level['count']

#    print 'get_elements()= total=%s, res_count=%s' % (total_len, len(res))
#    print level
    return (res, total_len)

def count_model(grouped, level_index, level_keys, expandedItems, data_provider):
    # подсчет количества строк в раскрытом уровне

#    model = Person

    # построим ключ кэша
#    cache_key = '%s__%s__%s__%s' % (','.join(grouped), level_index, ','.join(level_keys), add_to_count_key(expandedItems))
#    if cache_key in count_cache.keys():
#        print 'cached count...........'
#        return count_cache[cache_key]

#    print 'count_model(): grouped=%s, level_index=%s, level_keys=%s, expandedItems=%s' % (grouped, level_index, level_keys, expandedItems)
    total_of_level = 0
    if grouped:
        grouped_ranges = []
        # определим порядок группировки
        for i in grouped:
            grouped_ranges.append(i)

        query = data_provider.get_data()
        filter = None
        for lev in range(0, level_index):
            lev_field = grouped_ranges[lev]
            key = level_keys[lev]
            if filter:
                filter = filter & Q(**{lev_field:key})
            else:
                filter = Q(**{lev_field:key})
        if filter:
            query = query.filter(filter)
        if level_index < len(grouped_ranges):
            field = grouped_ranges[level_index]
            query = query.values(field).distinct()
        total_of_level = query.count()

    else:
        total_of_level = data_provider.get_data().count()

    # добавим к количеству также сумму раскрытых элементов
    exp_count = 0
    for exp in expandedItems:
        if exp['count'] == -1:
            exp['count'] = data_provider.counter(grouped, level_index + 1, level_keys + [exp['id']], exp['expandedItems'], data_provider)
        exp_count = exp_count + exp['count']

    #count_cache[cache_key] = total_of_level+exp_count

#    print 'count_model() = %s, total=%s, exp_count=%s' % (total_of_level + exp_count, total_of_level, exp_count)
    return total_of_level + exp_count

def read_model(grouped, offset, level_index, level_keys, begin, end, data_provider, aggregates, sorting):
    '''
    вывод элементов дерева группировок в зависимости от уровня, ключевых элементов и интервала в уровне
    '''
    #model = Person

    # построим ключ кэша
#    cache_key = '%s__%s__%s__%s__%s__%s' % (','.join(grouped), offset, level_index, ','.join(level_keys), begin, end)
#    if cache_key in out_cache.keys():
#        print 'cached data...........'
#        return out_cache[cache_key]

    #print 'read_model(): grouped=%s, offset=%s, level_index=%s, level_keys=%s, begin=%s, end=%s' % (grouped, offset, level_index, level_keys, begin, end)
    res = []
    if grouped:
        grouped_ranges = []
        # определим порядок группировки
        for i in grouped:
            grouped_ranges.append(i)

        # для всех группировочных элементов будут использоваться ключи
        # если берется уровень больший, чем количество группировок, то выдаем просто записи
        if level_index >= len(grouped_ranges):
            field = None
        else:
            field = grouped_ranges[level_index]

        filter = None
        for lev in range(0, level_index):
            lev_field = grouped_ranges[lev]
            key = level_keys[lev]
            if filter:
                filter = filter & Q(**{lev_field:key})
            else:
                filter = Q(**{lev_field:key})
        aggr = []
        # будем считать агрегаты
        for agg in aggregates.keys():
            agg_type = aggregates[agg]
            if agg_type == 'sum':
                aggr.append(Sum(agg))
            elif agg_type == 'count':
                aggr.append(Count(agg))
            elif agg_type == 'min':
                aggr.append(Min(agg))
            elif agg_type == 'max':
                aggr.append(Max(agg))
            elif agg_type == 'avg':
                aggr.append(Avg(agg))
        if filter:
            if field:
                if aggr:
                    query = data_provider.get_data().filter(filter).values(field).annotate(*aggr).annotate(count=Count(field))
                else:
                    query = data_provider.get_data().filter(filter).values(field).annotate(count=Count(field))
            else:
                query = data_provider.get_data().filter(filter)
        else:
            if field:
                if aggr:
                    query = data_provider.get_data().values(field).annotate(*aggr).annotate(count=Count(field))
                else:
                    query = data_provider.get_data().values(field).annotate(count=Count(field))
            else:
                query = data_provider.get_data()


        #сортировка 
        sort_fields = []
        if len(sorting.keys()) == 1:
            if sorting.values()[0] == 'DESC':
                sort_fields.append('-' + sorting.keys()[0])
            else:
                sort_fields.append(sorting.keys()[0])
        if field and not field in sorting:
            #нет заданной сортировки, отсортируем по этому полю
            sort_fields.append(field)
        if sort_fields:
            query = query.order_by(*sort_fields)

        # теперь выведем запрошенные элементы уровня
        index = 0
        for i in query.all()[begin:end + 1]:
            if field:
                item = data_provider.create_record()
                item.is_leaf = False
                item.index = offset + index + begin
                item.id = i[field]
                item.indent = level_index
                item.lindex = index + begin
                item.count = i['count']
                #установим все атрибуты из группировки
                for lev in range(0, level_index):
                    lev_field = grouped_ranges[lev]
                    key = level_keys[lev]
                    setattr(item, lev_field, key)
                setattr(item, field, i[field])

                for agg in aggregates.keys():
                    agg_type = aggregates[agg]
                    if agg_type == 'sum':
                        setattr(item, agg, i[agg + '__sum'])
                    elif agg_type == 'count':
                        setattr(item, agg, i[agg + '__count'])
                    elif agg_type == 'min':
                        setattr(item, agg, i[agg + '__min'])
                    elif agg_type == 'max':
                        setattr(item, agg, i[agg + '__max'])
                    elif agg_type == 'avg':
                        setattr(item, agg, i[agg + '__avg'])
                item.calc()
            else:
                item = data_provider.create_record()
                item.is_leaf = True
                item.index = offset + index + begin
                item.indent = level_index
                item.lindex = index + begin
                item.load(i)
                item.calc()
            res.append(item)
            index = index + 1
    else:
        # вывести без группировки
        index = 0
        query = data_provider.get_data()
        if len(sorting.keys()) == 1:
            if sorting.values()[0] == 'DESC':
                query = query.order_by('-' + sorting.keys()[0])
            else:
                query = query.order_by(sorting.keys()[0])
        for i in query.all()[begin:end + 1]:
            item = data_provider.create_record()
            item.indent = 0
            item.is_leaf = True
            item.count = 0
            item.lindex = index + begin
            item.index = index + begin
            item.load(i)
            item.calc()
            res.append(item)
            index = index + 1
    #print 'read_model()= total=%s, res_count=%s' % (total_of_level, len(res))
    #out_cache[cache_key] = (res,total_of_level)
    return res

def read_data(grouped, offset, level_index, level_keys, begin, end, data_provider, aggregates, sorting):
    '''
    вывод элементов дерева группировок в зависимости от уровня, ключевых элементов и интервала в уровне
    '''

    # построим ключ кэша
#    cache_key = '%s__%s__%s__%s__%s__%s' % (','.join(grouped), offset, level_index, ','.join(level_keys), begin, end)
#    if cache_key in out_cache.keys():
#        print 'cached data...........'
#        return out_cache[cache_key]

    #print 'out_data(): grouped=%s, offset=%s, level_index=%s, level_keys=%s, begin=%s, end=%s' % (grouped, offset, level_index, level_keys, begin, end)
    # проведем сортировку собранного уровня
    if len(sorting.keys()) == 1:
        sorted_data = sorted(data_provider.get_data(), key=lambda k: getattr(k, sorting.keys()[0]), reverse=(sorting.values()[0] == 'DESC'))
    else:
        sorted_data = data_provider.get_data()
    res = []
    if grouped:
        # для всех группировочных элементов будут использоваться ключи
        level = {}
        aggregate_values = {}
        ordered = []
        # если берется уровень больший, чем количество группировок, то выдаем просто записи
        if level_index >= len(grouped):
            field = None
        else:
            field = grouped[level_index]

        for rec in sorted_data:
            finded = True
            for lev in range(0, level_index):
                lev_field = grouped[lev]
                key = level_keys[lev]
                key_value = getattr(rec, lev_field)
                # подходит ли запись под группировку
                if key != key_value:
                    finded = False
                    break
            # если успешно проверили все поля, то значит это наша запись
            if finded:
                if field:
                    group_value = getattr(rec, field)
                    if not group_value in level.keys():
                        level[group_value] = 1
                        aggr_rec = {}
                        aggregate_values[group_value] = aggr_rec
                        ordered.append(group_value)
                    else:
                        level[group_value] = level[group_value] + 1
                        aggr_rec = aggregate_values[group_value]
                    # будем считать агрегаты
                    for agg in aggregates.keys():
                        agg_type = aggregates[agg]
                        agg_value = getattr(rec, agg)
                        if agg_type == 'sum':
                            aggr_rec[agg] = agg_value + (aggr_rec[agg] if aggr_rec.has_key(agg) else 0)
                        elif agg_type == 'count':
                            aggr_rec[agg] = agg_value + (1 if aggr_rec.has_key(agg) else 0)
                        elif agg_type == 'min':
                            aggr_rec[agg] = agg_value if aggr_rec.has_key(agg) and aggr_rec[agg] > agg_value else aggr_rec[agg]
                        elif agg_type == 'max':
                            aggr_rec[agg] = agg_value if aggr_rec.has_key(agg) and aggr_rec[agg] < agg_value else aggr_rec[agg]
                        elif agg_type == 'avg':
                            aggr_rec[agg] = agg_value + (aggr_rec[agg] if aggr_rec.has_key(agg) else 0)
                else:
                    level[rec.id] = rec
                    ordered.append(rec)
        # теперь выведем запрошенные элементы уровня
        index = 0
        for i in ordered[begin:end + 1]:
            if field:
                item = data_provider.create_record(index=offset + index + begin)
                setattr(item, field, i)
                item.id = i
                item.indent = level_index
                item.lindex = index + begin
                item.count = level[i]
                for agg in aggregates.keys():
                    # для средних - посчитаем среднее
                    if aggregates[agg] == 'avg':
                        setattr(item, agg, aggregate_values[i][agg] / item.count)
                    else:
                        setattr(item, agg, aggregate_values[i][agg])
                # проставим значения ключей уровня
                for lev in range(0, level_index):
                    lev_field = grouped[lev]
                    key = level_keys[lev]
                    setattr(item, lev_field, key)
                item.calc()
            else:
                item = data_provider.create_record()
                item.is_leaf = True
                item.index = offset + index + begin
                item.indent = level_index
                item.lindex = index + begin
                item.load(i)
                item.calc()
            res.append(item)
            index = index + 1
    else:
        # вывести без группировки
        index = 0
        for i in sorted_data[begin:end + 1]:
            item = data_provider.create_record()
            item.indent = 0
            item.is_leaf = True
            item.lindex = index + begin
            item.index = index + begin
            item.load(i)
            item.calc()
            res.append(item)
            index = index + 1
    #print 'out_data()= total=%s, res_count=%s' % (total_of_level, len(res))
#    out_cache[cache_key] = (res,total_of_level)
    return res

#count_cache = {}
#
#def add_to_count_key(expandedItems):
#    res = ''
#    for exp in expandedItems:
#        if res:
#            res = res+'__'  
#        res = res+exp['id']
#        r = add_to_count_key(exp['expandedItems'])
#        if r:
#            res = res+'+'+r
#    return res

def count_data(grouped, level_index, level_keys, expandedItems, data_provider):
    # подсчет количества строк в раскрытом уровне

    # построим ключ кэша
#    cache_key = '%s__%s__%s__%s' % (','.join(grouped), level_index, ','.join(level_keys), add_to_count_key(expandedItems))
#    if cache_key in count_cache.keys():
#        print 'cached count...........'
#        return count_cache[cache_key]

    #print 'count_exp_data(): grouped=%s, level_index=%s, level_keys=%s, expandedItems=%s' % (grouped, level_index, level_keys, expandedItems)
    total_of_level = 0
    if grouped:
        if level_index == 0:
            # вывести элементы 1-го уровня группировки (не нужно использовать ключи)
            level = []
            # переберем элементы и сформируем уровень
            field = grouped[level_index]
            for rec in data_provider.get_data():
                group_value = getattr(rec, field)
                if not group_value in level:
                    level.append(group_value)
            total_of_level = len(level)
        else:
            # для всех остальных элементов будут использоваться ключи
            level = []
            # если берется уровень больший, чем количество группировок, то выдаем просто записи
            if level_index >= len(grouped):
                field = None
            else:
                field = grouped[level_index]

            for rec in data_provider.get_data():
                for lev in range(0, level_index):
                    lev_field = grouped[lev]
                    key = level_keys[lev]
                    key_value = getattr(rec, lev_field)
                    # подходит ли запись под группировку
                    if key != key_value:
                        break
                    # если успешно проверили все поля, то значит это наша запись
                    elif lev == level_index - 1:
                        if field:
                            group_value = getattr(rec, field)
                            if not group_value in level:
                                level.append(group_value)
                        else:
                            level.append(rec)
            total_of_level = len(level)
    else:
        total_of_level = len(data_provider.get_data())

    # добавим к количеству также сумму раскрытых элементов
    exp_count = 0
    for exp in expandedItems:
        if exp['count'] == -1:
            exp['count'] = data_provider.counter(grouped, level_index + 1, level_keys + [exp['id']], exp['expandedItems'], data_provider)
        exp_count = exp_count + exp['count']

    #count_cache[cache_key] = total_of_level+exp_count

    #print 'count_exp_data() = %s, total=%s, exp_count=%s' % (total_of_level+exp_count, total_of_level, exp_count) 
    return total_of_level + exp_count

def index_data(grouped, level_index, level_keys, expandedItems, data_provider, sorting):
    # построение индексов элементов в раскрытом уровне, только для группировок и для тех, которые раскрыты
    res = []
    if grouped and len(expandedItems) > 0:
        # проведем сортировку уровня
        if len(sorting.keys()) == 1:
            sorted_data = sorted(data_provider.get_data(), key=lambda k: getattr(k, sorting.keys()[0]), reverse=(sorting.values()[0] == 'DESC'))
        else:
            sorted_data = data_provider.get_data()
        # для всех группировочных элементов будут использоваться ключи
        level = {}
        field = grouped[level_index]

        for rec in sorted_data:
            finded = True
            for lev in range(0, level_index):
                lev_field = grouped[lev]
                key = level_keys[lev]
                key_value = getattr(rec, lev_field)
                # подходит ли запись под группировку
                if key != key_value:
                    finded = False
                    break
            # если успешно проверили все поля, то значит это наша запись
            if finded:
                group_value = getattr(rec, field)
                if not group_value in level.keys():
                    level[group_value] = 1
                    res.append(group_value)
    return res

def index_model(grouped, level_index, level_keys, expandedItems, data_provider, sorting):
    # построение индексов элементов в раскрытом уровне, только для группировок и для тех, которые раскрыты
    res = []
    if grouped and len(expandedItems) > 0:
        # для всех группировочных элементов будут использоваться ключи
        # если берется уровень больший, чем количество группировок, то выдаем просто записи
        field = grouped[level_index]

        filter = None
        for lev in range(0, level_index):
            lev_field = grouped[lev]
            key = level_keys[lev]
            if filter:
                filter = filter & Q(**{lev_field:key})
            else:
                filter = Q(**{lev_field:key})
        if filter:
            query = data_provider.get_data().filter(filter).values(field).distinct()
        else:
            query = data_provider.get_data().values(field).distinct()
        #сортировка 
        sort_fields = []
        if len(sorting.keys()) == 1:
            if sorting.values()[0] == 'DESC':
                sort_fields.append('-' + sorting.keys()[0])
            else:
                sort_fields.append(sorting.keys()[0])
        if field and not field in sorting:
            #нет заданной сортировки, отсортируем по этому полю
            sort_fields.append(field)
        if sort_fields:
            query = query.order_by(*sort_fields)
        # теперь выведем запрошенные элементы уровня
        for i in query:
            res.append(i[field])
    return res