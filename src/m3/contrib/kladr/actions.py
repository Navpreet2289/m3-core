#coding:utf-8
from django.db.models.query_utils import Q
from m3.ui.actions import Action, PreJsonResult, OperationResult, ActionPack, ActionController
from models import KladrGeo, KladrStreet

kladr_controller = ActionController(url='/m3-kladr')

class KLADRPack(ActionPack):
    url = ''
    def __init__(self):
        self.get_places_action = KLADRRowsAction()
        self.get_streets_action = StreetRowsAction()
        self.get_addr_action = KLADRGetAddrAction()
        self.actions = [self.get_places_action, self.get_streets_action, self.get_addr_action]

    @classmethod
    def get_place_name(self, code):
        place = KladrGeo.objects.select_related('parent').select_related('parent__parent').select_related('parent__parent__parent').get(code = code)
        return place.display_name() if place else ''

    @classmethod
    def get_street_name(self, code):
        street = KladrStreet.objects.select_related('parent').get(code = code)
        return street.display_name() if street else ''

class KLADRRowsAction(Action):
    '''
    Перечисление элементов КЛАДРа
    '''
    url = '/kladr_rows$'
    
    def run(self, request, context):
        filter = request.REQUEST.get('filter')
        fields = ['name','code','socr'];
        words = filter.strip().split(' ')
        # первым этапом найдем территории подходящие под фильтр в имени
        condition = None
        for word in words:
            field_condition = None
            for field_name in fields:
                field = Q(**{field_name + '__icontains': word})
                field_condition = field_condition | field if field_condition else field
            condition = condition & field_condition if condition else field_condition
        places = KladrGeo.objects.filter(condition).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent').order_by('level','name')[0:50]
        # если не нашли, то будем искать с учетом родителей
        if len(places) == 0:
            condition = None
            for word in words:
                field_condition = None
                for field_name in fields:
                    field = Q(**{field_name + '__icontains': word}) | Q(**{'parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__parent__' + field_name + '__icontains': word})
                    field_condition = field_condition | field if field_condition else field
                condition = condition & field_condition if condition else field_condition
            places = KladrGeo.objects.filter(condition).select_related('parent').select_related('parent__parent').select_related('parent__parent__parent').order_by('level','name')[0:50]
        result = {'rows': list(places), 'total': len(places)}
        return PreJsonResult(result)

class StreetRowsAction(Action):
    '''
    Перечисление улиц
    '''
    url = '/street_rows$'
    
    def run(self, request, context):
        filter = request.REQUEST.get('filter')
        place_code = request.REQUEST.get('place_code')
        place_id = None
        if place_code:
            place = KladrGeo.objects.filter(code=place_code)
            if place and len(place) == 1:
                place_id = place[0].id
        fields = ['name','code','socr'];
        words = filter.strip().split(' ')
        # первым этапом найдем территории подходящие под фильтр в имени
        condition = None
        for word in words:
            field_condition = None
            for field_name in fields:
                field = Q(**{field_name + '__icontains': word})
                field_condition = field_condition | field if field_condition else field
            condition = condition & field_condition if condition else field_condition
        if place_id:
            places = KladrStreet.objects.filter(condition, parent = place_id).select_related('parent').order_by('name')[0:50]
        else:
            places = KladrStreet.objects.filter(condition).select_related('parent').order_by('name')[0:50]
        # если не нашли, то будем искать с учетом родителей
        if len(places) == 0:
            condition = None
            for word in words:
                field_condition = None
                for field_name in fields:
                    field = Q(**{field_name + '__icontains': word}) | Q(**{'parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__' + field_name + '__icontains': word}) | Q(**{'parent__parent__parent__' + field_name + '__icontains': word})
                    field_condition = field_condition | field if field_condition else field
                condition = condition & field_condition if condition else field_condition
            if place_id:
                places = KladrStreet.objects.filter(condition, parent = place_id).select_related('parent').order_by('name')[0:50]
            else:
                places = KladrStreet.objects.filter(condition).select_related('parent').order_by('name')[0:50]
        result = {'rows': list(places), 'total': len(places)}
        return PreJsonResult(result)
    
class KLADRGetAddrAction(Action):
    '''
    Расчет адреса по составляющим
    '''
    url = '/kladr_getaddr$'
    
    def run(self, request, context):
        place = request.REQUEST.get('place')
        if place:
            place = KladrGeo.objects.filter(code=place)[0]
        street = request.REQUEST.get('street')
        if street:
            street = KladrStreet.objects.filter(code=street)[0]
        house = request.REQUEST.get('house')
        flat = request.REQUEST.get('flat')
        addr_cmp = request.REQUEST.get('addr_cmp')
        '''
        типАдреса = 0 или 1
        текИндекс = 0
        адрес = ""
        текУровень = 5
        текЭлемент = кодУлицы
        если типАдреса = 0
            раделитель = ", "
        иначе
            раделитель = ","
        пока текЭлемент >= 0
            если типАдреса > 0 и текЭлемент = 0
                выход
            для всех территорий у которых код = текЭлемент
                имя = территория.имя
                родитель = территория.родитель
                уровень = территория.уровень
                индекс = территория.индекс
                сокр = территория.сокр
                если текИндекс = 0 и индекс <> 0, то текИндекс = индекс
                если типАдреса = 0
                    адрес = сокр+" "+имя+раделитель+адрес
                иначе
                    текЭлемент = родитель
                    пока текУровень > уровень
                        текУровень = текУровень-1
                        адрес = раделитель+адрес
                    адрес = сокр+" "+имя+раделитель+адрес
                    текУровень = текУровень-1
            если текЭлемент = 0 и родитель = 0
                выход
            текЭлемент = родитель
        если типАдреса = 0
            если индекс > 0
                адрес = индекс+раделитель+адрес
        иначе
            пока текУровень > 1
                текУровень = текУровень-1
                адрес = раделитель+адрес
            адрес = регион+раделитель+адрес
            если индекс > 0
                адрес = раделитель+индекс+раделитель+адрес
            иначе
                адрес = раделитель+раделитель+адрес
        '''
        addr_type = 0
        curr_index = ''
        addr_text = ''
        curr_level = 5
        if street:
            curr_item = street
        else:
            curr_item = place
        if addr_type == 0:
            delim = ', '
        else:
            delim = ','
        while curr_item:
            if addr_type != 0 and curr_item.parent == None:
                break
            if curr_index == '' and curr_item.zipcode:
                curr_index = curr_item.zipcode
            if addr_type == 0:
                addr_text = curr_item.socr+" "+curr_item.name+delim+addr_text
            else:
                if curr_item == street:
                    lv = 4
                else:
                    lv = curr_item.level
                while curr_level > lv:
                    curr_level -= 1
                    addr_text = delim+addr_text
                addr_text = curr_item.socr+" "+curr_item.namebind_pack+delim+addr_text
                curr_level -= 1
            curr_item = curr_item.parent
        if addr_type == 0:
            if curr_index != '':
                addr_text = curr_index+delim+addr_text
        else:
            while curr_level > 1:
                curr_level -= 1
                addr_text = delim+addr_text
            addr_text = 'регион'+delim+addr_text
            if curr_index != '':
                addr_text = curr_index+delim+addr_text
            else:
                addr_text = delim+delim+addr_text
        if house:
            addr_text = addr_text+u'д. '+house
        if flat:
            addr_text = addr_text+delim+u'кв. '+flat
        result = u'(function(){ Ext.getCmp("'+addr_cmp+'").setValue("'+addr_text+'");})()'
        return OperationResult(success=True, code = result)