#coding:utf-8
'''
Created on 31.03.2011

@author: akvarats
'''

import calendar
from datetime import date, timedelta
from django.core.exceptions import ObjectDoesNotExist
from m3.contrib.m3_calendar.models import ExceptedDayTypeEnum, ExceptedDay


class M3Calendar(object):
# Сначала я пробовал наследоваться базового питонячьего класса для календаря
# calendar.Calendar. Но потом передумал, так как не нашел серьезных плюсов.

    
    # Программный слой накладывающихся на основной календарь выходных и
    # праздничных дней. Сначала накладывается программный слой, а затем
    # переопределенный пользователем слой из базы.
    template = None

    def __init__(self):
        self.days = []
        self.one_day = timedelta(1)

    def clear_days(self):
        '''Очищает накопленный стек дней'''
        self.days = []

    def get_days_by_period_from_db(self, start_date, end_date,
                                   types=(ExceptedDayTypeEnum.WORKDAY,)):
        '''
        Вытаскивает нужные типы дней массивом из одних лишь питоновских дат.
        @param types: типы дней, которые мы хотим вытащить. По умолчанию
        вытаскиваем рабочие дни.
        '''
        db_days = ExceptedDay.objects.filter(day__lte=end_date, day__gte=start_date,
                                             type__in = types)\
        .distinct().order_by('day').values_list('day', flat=True)

        return list(db_days)
        
    def _is_working_date(self, cdate):
        '''
        Проверяет, является ли пришедшая дата рабочим днем.
        Должен быть перегружен в классах наследниках с учетом проверок
        на заданный атрибут класса template.
        По умолчанию отсеивает выходные дни
        '''
        return isinstance(cdate, date) \
               and cdate.weekday() not in (calendar.SATURDAY, calendar.SUNDAY)

    def _is_dayoff_date(self, cdate):
        '''
        Проверяет, является ли пришедшая дата обычным выходным днем.
        Должен быть перегружен в классах наследниках с учетом проверок
        на заданный атрибут класса template.
        По умолчанию отсеивает дни с понедельника по пятницу
        '''
        return isinstance(cdate, date) \
               and cdate.weekday() in (calendar.SATURDAY, calendar.SUNDAY)

    def _prepare_days_for_period_operations(self, start_date, end_date):
        self.clear_days()
        start_end_delta = end_date - start_date

        current_day = start_date
        for day in range(start_end_delta.days):
            self.days.append(current_day)
            current_day += self.one_day

    def days_by_period(self, start_date, end_date, types=(ExceptedDayTypeEnum.WORKDAY,)):
        '''Количество дней с указанными типами за данный период.'''
        self._prepare_days_for_period_operations(start_date, end_date)

        result_days = []
        if ExceptedDayTypeEnum.WORKDAY in types:
            result_days.extend([day for day in self.days if self._is_working_date(day)])
        if ExceptedDayTypeEnum.DAYOFF in types:
            result_days.extend([day for day in self.days if self._is_dayoff_date(day)])

        db_dates = self.get_days_by_period_from_db(start_date, end_date, types)

        result_days.extend(db_dates)
        #Сортируем
        result_days = list(set(result_days))
        return result_days

    def work_days_by_period(self, start_date, end_date):
        '''Отдает список всех рабочих дней в периоде'''
        return self.days_by_period(start_date, end_date)

    def weekend_days_by_period(self, start_date, end_date):
        '''Отдает список всех выходных и праздничных дней в периоде'''
        return self.days_by_period(start_date, end_date,
               (ExceptedDayTypeEnum.HOLIDAY, ExceptedDayTypeEnum.DAYOFF))

    def working_days_by_bound(self, date, count, bound_since=True):
        pass

    @classmethod
    def add_date_to_db(cls, date, type=ExceptedDayTypeEnum.HOLIDAY):
        try:
            save_date = ExceptedDay.objects.get(day=date)
        except ObjectDoesNotExist:
            save_date = ExceptedDay(day=date)

        save_date.type = type
        save_date.save()